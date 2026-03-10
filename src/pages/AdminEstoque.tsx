import { useState, useEffect, useCallback } from 'react';
import { adminEstoque, adminProdutos } from '@/services/api';
import type { ProdutoAdmin, LogEstoque } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const AdminEstoque = () => {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntrada, setShowEntrada] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<LogEstoque[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setProdutos(await adminProdutos.listar()); }
    catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const registrarEntrada = async () => {
    const pid = parseInt(produtoId);
    const qty = parseInt(quantidade);
    if (!pid || !qty || qty <= 0) { toast.error('Dados inválidos'); return; }
    try {
      await adminEstoque.entrada({ produtoId: pid, quantidade: qty });
      toast.success('Entrada registrada');
      setShowEntrada(false);
      setProdutoId('');
      setQuantidade('');
      carregar();
    } catch { toast.error('Erro ao registrar'); }
  };

  const verHistorico = async (pid: number) => {
    setShowHistorico(true);
    setHistoricoLoading(true);
    try { setHistorico(await adminEstoque.historico(pid)); }
    catch { toast.error('Erro ao carregar histórico'); setHistorico([]); }
    finally { setHistoricoLoading(false); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Estoque</h1>
        <Button onClick={() => setShowEntrada(true)}><Plus className="w-4 h-4 mr-2" />Entrada de Estoque</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="w-24">Histórico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : produtos.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>
                  <Badge variant={p.quantidadeEstoque > 10 ? 'default' : p.quantidadeEstoque > 0 ? 'secondary' : 'destructive'}>
                    {p.quantidadeEstoque}
                  </Badge>
                </TableCell>
                <TableCell>R$ {p.preco.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => verHistorico(p.id)}><History className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Entrada */}
      <Dialog open={showEntrada} onOpenChange={setShowEntrada}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Entrada de Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {produtos.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={registrarEntrada}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Histórico de Movimentação</DialogTitle></DialogHeader>
          {historicoLoading ? (
            <p className="text-muted-foreground text-center py-4">Carregando...</p>
          ) : historico.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Sem movimentações</p>
          ) : (
            <div className="max-h-80 overflow-auto space-y-2">
              {historico.map(log => (
                <div key={log.id} className="flex items-center justify-between bg-muted rounded-lg p-3 text-sm">
                  <div>
                    <Badge variant={log.tipoMovimentacao === 'ENTRADA' ? 'default' : 'destructive'} className="mr-2">
                      {log.tipoMovimentacao}
                    </Badge>
                    <span className="text-muted-foreground">{log.nomeUsuario}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{log.quantidade} un</span>
                    <p className="text-xs text-muted-foreground">{new Date(log.dataMovimentacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEstoque;
