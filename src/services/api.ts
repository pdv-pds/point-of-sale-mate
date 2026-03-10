const API_BASE = 'http://localhost:8083/api';

function getToken(): string | null {
  return localStorage.getItem('pdv_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('pdv_token');
    window.location.href = '/login';
    throw new Error('Não autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Types
export interface LoginRequest { login: string; senha: string; }
export interface LoginResponse { token: string; }

export interface ProdutoCaixa { id: number; nome: string; preco: number; quantidadeEstoque: number; }
export interface ProdutoAdmin { id: number; nome: string; preco: number; quantidadeEstoque: number; ativo: boolean; }
export interface ProdutoRequest { nome: string; preco: number; quantidadeEstoque: number; }

export interface ItemVendaRequest { produtoId: number; quantidade: number; }
export interface ItemVenda { id: number; produtoId: number; nomeProduto: string; quantidade: number; precoUnitario: number; subtotal: number; }
export interface Venda { id: number; caixaId: number; dataVenda: string; valorTotal: number; valorPago: number; troco: number; status: 'ABERTA' | 'FINALIZADA' | 'CANCELADA'; dataCriacao: string; itens: ItemVenda[]; }
export interface VendaFinalizar { valorPago: number; }

export interface CaixaAbrir { valorInicial: number; }
export interface CaixaResponse { id: number; usuarioId: number; nomeUsuario: string; valorInicial: number; valorFinal: number; dataAbertura: string; dataFechamento: string | null; status: 'ABERTO' | 'FECHADO'; }
export interface CaixaResumo { caixa: CaixaResponse; totalVendas: number; quantidadeVendas: number; }
export interface CaixaFechamento { valorFinal: number; }

export interface Usuario { id: number; nome: string; login: string; role: string; ativo: boolean; }
export interface UsuarioCreate { nome: string; login: string; senha: string; role: string; }
export interface UsuarioUpdate { nome?: string; login?: string; senha?: string; role?: string; ativo?: boolean; }

export interface LogEstoqueRequest { produtoId: number; quantidade: number; }
export interface LogEstoque { id: number; produtoId: number; nomeProduto: string; usuarioId: number; nomeUsuario: string; quantidade: number; tipoMovimentacao: 'ENTRADA' | 'SAIDA'; dataMovimentacao: string; }

// Auth
export const auth = {
  login: (data: LoginRequest) => request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// Caixa
export const caixa = {
  abrir: (data: CaixaAbrir) => request<CaixaResponse>('/caixa/abrir', { method: 'POST', body: JSON.stringify(data) }),
  fechar: (data: CaixaFechamento) => request<CaixaResponse>('/caixa/fechar', { method: 'POST', body: JSON.stringify(data) }),
  aberto: () => request<CaixaResponse>('/caixa/aberto'),
  resumo: (id: number) => request<CaixaResumo>(`/caixa/resumo/${id}`),
};

// Venda
export const venda = {
  atual: () => request<Venda>('/venda/atual'),
  adicionarItem: (data: ItemVendaRequest) => request<Venda>('/venda/item', { method: 'POST', body: JSON.stringify(data) }),
  removerItem: (itemId: number) => request<Venda>(`/venda/item/${itemId}`, { method: 'DELETE' }),
  finalizar: (data: VendaFinalizar) => request<Venda>('/venda/finalizar', { method: 'POST', body: JSON.stringify(data) }),
};

// Produtos (caixa)
export const produtos = {
  listar: () => request<ProdutoCaixa[]>('/produtos'),
  buscar: (id: number) => request<ProdutoCaixa>(`/produtos/${id}`),
};

// Admin - Produtos
export const adminProdutos = {
  listar: () => request<ProdutoAdmin[]>('/admin/produtos'),
  buscar: (id: number) => request<ProdutoAdmin>(`/admin/produtos/${id}`),
  criar: (data: ProdutoRequest) => request<ProdutoAdmin>('/admin/produtos', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: Partial<ProdutoRequest>) => request<ProdutoAdmin>(`/admin/produtos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  excluir: (id: number) => request<void>(`/admin/produtos/${id}`, { method: 'DELETE' }),
};

// Admin - Estoque
export const adminEstoque = {
  entrada: (data: LogEstoqueRequest) => request<LogEstoque>('/admin/estoque/entrada', { method: 'POST', body: JSON.stringify(data) }),
  historico: (produtoId: number) => request<LogEstoque[]>(`/admin/estoque/produto/${produtoId}`),
};

// Admin - Usuarios
export const adminUsuarios = {
  listar: () => request<Usuario[]>('/usuarios'),
  buscar: (id: number) => request<Usuario>(`/usuarios/${id}`),
  criar: (data: UsuarioCreate) => request<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: UsuarioUpdate) => request<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  excluir: (id: number) => request<void>(`/usuarios/${id}`, { method: 'DELETE' }),
};
