import { useState, useEffect, useCallback } from 'react';
import { adminUsuarios } from '@/services/api';
import type { Usuario, UsuarioCreate, UsuarioUpdate } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const AdminUsuarios = () => {
  const [lista, setLista] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UsuarioCreate>({ nome: '', email: '', senha: '', perfil: 'CAIXA' });
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState<UsuarioUpdate>({});

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setLista(await adminUsuarios.listar()); }
    catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) { toast.error('Preencha todos os campos'); return; }
    try {
      await adminUsuarios.criar(form);
      toast.success('Usuário criado');
      setShowForm(false);
      setForm({ nome: '', email: '', senha: '', perfil: 'CAIXA' });
      carregar();
    } catch { toast.error('Erro ao criar'); }
  };

  const excluir = async (id: number) => {
    if (!confirm('Deseja excluir este usuário?')) return;
    try { await adminUsuarios.excluir(id); toast.success('Excluído'); carregar(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const abrirEdicao = (u: Usuario) => {
    setEditing(u);
    setEditForm({
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      status: u.status,
      novaSenha: '',
    });
  };

  const salvarEdicao = async () => {
    if (!editing) return;
    const payload: UsuarioUpdate = {
      nome: editForm.nome,
      email: editForm.email,
      perfil: editForm.perfil,
      status: editForm.status,
    };

    if (editForm.novaSenha && editForm.novaSenha.trim()) {
      payload.novaSenha = editForm.novaSenha.trim();
    }

    if (!payload.nome?.trim() || !payload.email?.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      await adminUsuarios.atualizar(editing.id, payload);
      toast.success('Usuário atualizado');
      setEditing(null);
      setEditForm({});
      carregar();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Novo Usuário</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : lista.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário</TableCell></TableRow>
            ) : lista.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{u.perfil}</Badge></TableCell>
                <TableCell><Badge variant={u.status ? 'default' : 'secondary'}>{u.status ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicao(u)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => excluir(u.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Senha</Label><Input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.perfil} onValueChange={v => setForm(f => ({ ...f, perfil: v as 'CAIXA' | 'ADMIN' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CAIXA">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={salvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Editar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editForm.nome ?? ''}
                onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email ?? ''}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={editForm.perfil ?? 'CAIXA'}
                onValueChange={v => setEditForm(f => ({ ...f, perfil: v as 'CAIXA' | 'ADMIN' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CAIXA">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">Ativo / Inativo</p>
              </div>
              <Switch
                checked={editForm.status ?? true}
                onCheckedChange={checked => setEditForm(f => ({ ...f, status: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nova senha (opcional)</Label>
              <Input
                type="password"
                placeholder="Preencha para alterar a senha"
                value={editForm.novaSenha ?? ''}
                onChange={e => setEditForm(f => ({ ...f, novaSenha: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
