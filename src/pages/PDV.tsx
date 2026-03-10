import { useState, useEffect, useCallback } from 'react';
import { produtos as produtosApi, venda as vendaApi, caixa as caixaApi } from '@/services/api';
import type { ProdutoCaixa, Venda, CaixaResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus, Minus, Trash2, DollarSign, ShoppingBag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const PDV = () => {
  const [produtosList, setProdutosList] = useState<ProdutoCaixa[]>([]);
  const [vendaAtual, setVendaAtual] = useState<Venda | null>(null);
  const [caixaAberto, setCaixaAberto] = useState<CaixaResponse | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [valorPago, setValorPago] = useState('');
  const [showFecharCaixa, setShowFecharCaixa] = useState(false);
  const [valorFinal, setValorFinal] = useState('');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const cx = await caixaApi.aberto().catch(() => null);
      setCaixaAberto(cx);
      if (cx) {
        const [prods, v] = await Promise.all([
          produtosApi.listar().catch(() => []),
          vendaApi.atual().catch(() => null),
        ]);
        setProdutosList(prods);
        setVendaAtual(v);
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const adicionarItem = async (produtoId: number) => {
    try {
      const v = await vendaApi.adicionarItem({ produtoId, quantidade: 1 });
      setVendaAtual(v);
    } catch {
      toast.error('Erro ao adicionar item');
    }
  };

  const removerItem = async (itemId: number) => {
    try {
      const v = await vendaApi.removerItem(itemId);
      setVendaAtual(v);
    } catch {
      toast.error('Erro ao remover item');
    }
  };

  const finalizarVenda = async () => {
    const valor = parseFloat(valorPago.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { toast.error('Valor inválido'); return; }
    try {
      const v = await vendaApi.finalizar({ valorPago: valor });
      toast.success(`Venda finalizada! Troco: R$ ${v.troco.toFixed(2)}`);
      setVendaAtual(null);
      setShowFinalizar(false);
      setValorPago('');
      // Reload products for updated stock
      const prods = await produtosApi.listar().catch(() => []);
      setProdutosList(prods);
    } catch {
      toast.error('Erro ao finalizar venda');
    }
  };

  const abrirCaixa = async () => {
    const valor = parseFloat(valorInicial.replace(',', '.'));
    if (isNaN(valor) || valor < 0) { toast.error('Valor inválido'); return; }
    try {
      const cx = await caixaApi.abrir({ valorInicial: valor });
      setCaixaAberto(cx);
      setShowAbrirCaixa(false);
      setValorInicial('');
      toast.success('Caixa aberto!');
      carregarDados();
    } catch {
      toast.error('Erro ao abrir caixa');
    }
  };

  const fecharCaixa = async () => {
    const valor = parseFloat(valorFinal.replace(',', '.'));
    if (isNaN(valor) || valor < 0) { toast.error('Valor inválido'); return; }
    try {
      await caixaApi.fechar({ valorFinal: valor });
      setCaixaAberto(null);
      setVendaAtual(null);
      setShowFecharCaixa(false);
      setValorFinal('');
      toast.success('Caixa fechado!');
    } catch {
      toast.error('Erro ao fechar caixa');
    }
  };

  const filteredProducts = produtosList.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full p-8"><div className="text-muted-foreground">Carregando...</div></div>;
  }

  if (!caixaAberto) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-8 text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 mx-auto text-warning mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Caixa Fechado</h2>
          <p className="text-muted-foreground text-sm mb-6">Abra o caixa para iniciar as vendas.</p>
          <Button onClick={() => setShowAbrirCaixa(true)} className="w-full">Abrir Caixa</Button>
        </Card>

        <Dialog open={showAbrirCaixa} onOpenChange={setShowAbrirCaixa}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Abrir Caixa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Valor Inicial (R$)</Label>
              <Input value={valorInicial} onChange={e => setValorInicial(e.target.value)} placeholder="0,00" autoFocus />
            </div>
            <DialogFooter><Button onClick={abrirCaixa}>Confirmar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFecharCaixa(true)} size="sm" className="text-destructive">
            Fechar Caixa
          </Button>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min">
          {filteredProducts.map(p => (
            <button
              key={p.id}
              onClick={() => adicionarItem(p.id)}
              disabled={p.quantidadeEstoque <= 0}
              className="bg-card rounded-xl border p-4 text-left hover:border-primary hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm truncate">{p.nome}</h3>
              <p className="text-primary font-bold mt-1">R$ {p.preco.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Estoque: {p.quantidadeEstoque}</p>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-card flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-display font-bold text-lg">Venda Atual</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {(!vendaAtual || vendaAtual.itens.length === 0) && (
            <div className="text-center text-muted-foreground py-12 text-sm">
              Nenhum item adicionado
            </div>
          )}
          {vendaAtual?.itens.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.nomeProduto}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-sm whitespace-nowrap">R$ {item.subtotal.toFixed(2)}</span>
              <button onClick={() => removerItem(item.id)} className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="font-display text-2xl font-bold">R$ {(vendaAtual?.valorTotal ?? 0).toFixed(2)}</span>
          </div>
          <Button
            onClick={() => { setValorPago((vendaAtual?.valorTotal ?? 0).toFixed(2).replace('.', ',')); setShowFinalizar(true); }}
            disabled={!vendaAtual || vendaAtual.itens.length === 0}
            className="w-full h-14 text-base font-semibold rounded-xl"
            variant="success"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Finalizar Venda
          </Button>
        </div>
      </div>

      {/* Finalizar Dialog */}
      <Dialog open={showFinalizar} onOpenChange={setShowFinalizar}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Finalizar Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total da venda</p>
              <p className="font-display text-3xl font-bold">R$ {(vendaAtual?.valorTotal ?? 0).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>Valor Pago (R$)</Label>
              <Input value={valorPago} onChange={e => setValorPago(e.target.value)} placeholder="0,00" autoFocus className="text-center text-xl h-14" />
            </div>
            {(() => {
              const pago = parseFloat(valorPago.replace(',', '.'));
              const total = vendaAtual?.valorTotal ?? 0;
              if (!isNaN(pago) && pago >= total) {
                return (
                  <div className="bg-success/10 rounded-xl p-3 text-center">
                    <p className="text-sm text-muted-foreground">Troco</p>
                    <p className="font-display text-xl font-bold text-success">R$ {(pago - total).toFixed(2)}</p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <DialogFooter><Button onClick={finalizarVenda} variant="success" className="w-full h-12">Confirmar Pagamento</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa Dialog */}
      <Dialog open={showFecharCaixa} onOpenChange={setShowFecharCaixa}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Fechar Caixa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Valor Final em Caixa (R$)</Label>
            <Input value={valorFinal} onChange={e => setValorFinal(e.target.value)} placeholder="0,00" autoFocus />
          </div>
          <DialogFooter><Button onClick={fecharCaixa} variant="destructive">Fechar Caixa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;
