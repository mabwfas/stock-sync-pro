// StockSync Pro - API Module  
const SyncAPI = {
    storage: {
        get(key, def = null) { try { return JSON.parse(localStorage.getItem(`sync_${key}`)) || def; } catch { return def; } },
        set(key, val) { localStorage.setItem(`sync_${key}`, JSON.stringify(val)); }
    },

    products: {
        getAll() { return SyncAPI.storage.get('products', []); },
        save(products) { SyncAPI.storage.set('products', products); },
        add(product) {
            const products = this.getAll();
            product.id = 'SKU-' + Date.now().toString(36).toUpperCase();
            product.createdAt = new Date().toISOString();
            product.history = [{ date: new Date().toISOString(), stock: product.stock, action: 'created' }];
            products.unshift(product);
            this.save(products);
            return product;
        },
        update(id, updates) {
            const products = this.getAll();
            const idx = products.findIndex(p => p.id === id);
            if (idx !== -1) {
                if (updates.stock !== undefined && updates.stock !== products[idx].stock) {
                    products[idx].history = products[idx].history || [];
                    products[idx].history.push({ date: new Date().toISOString(), stock: updates.stock, action: 'updated', prev: products[idx].stock });
                }
                Object.assign(products[idx], updates);
                this.save(products);
                return products[idx];
            }
            return null;
        },
        delete(id) { let products = this.getAll(); products = products.filter(p => p.id !== id); this.save(products); },
        bulkUpdate(updates) {
            const products = this.getAll();
            updates.forEach(u => {
                const idx = products.findIndex(p => p.id === u.id);
                if (idx !== -1) Object.assign(products[idx], u);
            });
            this.save(products);
        }
    },

    locations: {
        getAll() { return SyncAPI.storage.get('locations', [{ id: 'loc1', name: 'Main Warehouse', isDefault: true }]); },
        save(locations) { SyncAPI.storage.set('locations', locations); },
        add(location) { const locs = this.getAll(); location.id = 'loc-' + Date.now().toString(36); locs.push(location); this.save(locs); return location; },
        delete(id) { let locs = this.getAll(); locs = locs.filter(l => l.id !== id); this.save(locs); }
    },

    transfers: {
        getAll() { return SyncAPI.storage.get('transfers', []); },
        save(transfers) { SyncAPI.storage.set('transfers', transfers); },
        create(from, to, items) {
            const transfers = this.getAll();
            const transfer = { id: 'TRF-' + Date.now().toString(36).toUpperCase(), from, to, items, status: 'pending', createdAt: new Date().toISOString() };
            transfers.unshift(transfer);
            this.save(transfers);
            return transfer;
        },
        complete(id) {
            const transfers = this.getAll();
            const t = transfers.find(tr => tr.id === id);
            if (t) { t.status = 'completed'; t.completedAt = new Date().toISOString(); this.save(transfers); }
        }
    },

    getAnalytics() {
        const products = this.products.getAll();
        const lowStock = products.filter(p => p.stock <= (p.alertThreshold || 10));
        const outOfStock = products.filter(p => p.stock === 0);
        const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0);
        return { total: products.length, lowStock: lowStock.length, outOfStock: outOfStock.length, totalValue, locations: this.locations.getAll().length };
    },

    toast: { show(msg, type = 'success') { const c = document.getElementById('toast-container') || this.create(); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${msg}`; c.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); }, create() { const c = document.createElement('div'); c.id = 'toast-container'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;'; document.body.appendChild(c); const s = document.createElement('style'); s.textContent = '.toast{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#1e1e3f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;margin-bottom:10px;transform:translateX(120%);transition:0.3s;}.toast.show{transform:translateX(0);}.toast-success{border-left:3px solid #10b981;}.toast-warning{border-left:3px solid #f59e0b;}'; document.head.appendChild(s); return c; }, warning(msg) { this.show(msg, 'warning'); } }
};
window.SyncAPI = SyncAPI;
