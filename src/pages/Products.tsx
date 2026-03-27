import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const categories = [...new Set(products?.map(p => p.category).filter(Boolean) ?? [])];

  const filtered = products?.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil((filtered?.length || 0) / itemsPerPage);
  const paginated = filtered?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="section-title mb-8">Nossos Produtos</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="input-styled pl-10"
          />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1); }} className="input-styled sm:w-48">
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card-product animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated && paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {paginated.map(p => <ProductCard key={p.id} {...p} />)}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-hero px-4 py-2 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-hero px-4 py-2 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-20">Nenhum produto encontrado.</p>
      )}
    </div>
  );
}
