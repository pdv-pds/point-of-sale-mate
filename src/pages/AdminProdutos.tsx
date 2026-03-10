import { useState, useEffect, useCallback } from 'react';
import { adminProdutos } from '@/services/api';
import type { ProdutoAdmin, ProdutoRequest } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const AdminProdutos = () => {
  const [lista, setLista] = useState<ProdutoAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<ProdutoAdmin | null>(null);
  const [form, setForm] = useState<ProdutoRequest>({ nome: '', preco: 0, quantidadeEstoque: 0 });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista(await adminProdutos.listar());
    } catch { toast.error('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirCriacao = () => { setEditando(null); setForm({ nome: '', preco: 0, quantidadeEstoque: 0 }); setShowForm(true); };
  const abrirEdicao = (p: ProdutoAdmin) => { setEditando(p); setForm({ nome: p.nome, preco: p.preco, quantidadeEstoque: p.quantidadeEstoque }); setShowForm(true); };

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    try {
      if (editando) {
        await adminProdutos.atualizar(editando.id, form);
        toast.success('Produto atualizado');
      } else {
        await adminProdutos.criar(form);
        toast.success('Produto criado');
      }
      setShowForm(false);
      carregar();
    } catch { toast.error('Erro ao salvar'); }
  };

  const excluir = async (id: number) => {
    if (!confirm('Deseja excluir este produto?')) return;
    try { await adminProdutos.excluir(id); toast.success('Excluído'); carregar(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = lista.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Produtos</h1>
        <Button onClick={abrirCriacao}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum produto</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>R$ {p.preco.toFixed(2)}</TableCell>
                <TableCell>{p.quantidadeEstoque}</TableCell>
                <TableCell><Badge variant={p.ativo ? 'default' : 'secondary'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => excluir(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editando ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={form.quantidadeEstoque} onChange={e => setForm(f => ({ ...f, quantidadeEstoque: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter><Button onClick={salvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProdutos;
