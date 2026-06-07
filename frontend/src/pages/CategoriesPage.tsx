import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { categories } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import { IconTags } from '../components/Icons';

const ICONS = ['📦', '💳', '🏠', '🚗', '🍽️', '🛒', '💊', '🎓', '✈️', '🎮', '👕', '⚡', '📱', '🎵', '🏋️', '🎁'];
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function CategoriesPage() {
  const [catList, setCatList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6B7280');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetch = async () => { try { setCatList(await categories.list()); } catch {} };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) { await categories.update(editingId, { name, icon, color }); toast.success('Category updated'); }
      else { await categories.create({ name, icon, color }); toast.success('Category created'); }
      setShowForm(false); setEditingId(null); setName(''); setIcon('📦'); setColor('#6B7280');
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (cat: any) => { setEditingId(cat.id); setName(cat.name); setIcon(cat.icon); setColor(cat.color); setShowForm(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await categories.delete(id); toast.success('Deleted'); fetch(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconTags size={28} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction Categories</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Organize your transactions</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setName(''); setIcon('📦'); setColor('#6B7280'); }} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </motion.div>

      {showForm && (
        <motion.div variants={item}>
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(i => (
                    <button key={i} type="button" onClick={() => setIcon(i)} className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 text-lg transition-all ${icon === i ? 'border-blue-500 bg-blue-500/10' : ''}`} style={icon !== i ? { borderColor: 'var(--border)' } : undefined}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 p-0.5 rounded-xl cursor-pointer bg-transparent" style={{ borderColor: 'var(--border)' }} />
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">{editingId ? 'Update' : 'Create'} Category</motion.button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {catList.length === 0 ? (
          <GlassCard className="col-span-full p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No categories yet. Create one to organize your transactions.</p>
          </GlassCard>
        ) : (
          catList.map(cat => (
            <GlassCard key={cat.id} style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat._count?.transfers || 0} txns</span>
              </div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
              <div className="flex gap-3 mt-3">
                <button onClick={() => handleEdit(cat)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
              </div>
            </GlassCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
