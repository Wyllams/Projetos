/**
 * Integração Unsplash para buscar imagens contextuais de alta resolução.
 */

// Chave da API do Unsplash a partir do .env
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function buscarImagemUnsplash(termo: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === "dummy") {
    console.log(`[Unsplash Mock] Resolvendo termo: ${termo}`);
    
    // Fallback de imagens temáticas garantindo belas fotos se não houver API
    const termoLower = termo.toLowerCase();
    if (termoLower.includes("barber") || termoLower.includes("cabelo")) {
      return "https://images.unsplash.com/photo-1593062096033-9a26b09da705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Barbearia
    }
    if (termoLower.includes("cafe") || termoLower.includes("coffee")) {
      return "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Cafe
    }
    if (termoLower.includes("comida") || termoLower.includes("food") || termoLower.includes("pizza")) {
      return "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Comida
    }
    if (termoLower.includes("odonto") || termoLower.includes("dentista") || termoLower.includes("saude")) {
      return "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Dentista/Saude
    }

    // Default genérico minimalista empresarial
    return "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  }

  // Integração real
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(termo)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`);
    if (!res.ok) throw new Error("Erro na API do Unsplash");
    
    const dados = await res.json();
    if (dados.results && dados.results.length > 0) {
      // url .regular tem tamanho bom para GMB (~1080px)
      return dados.results[0].urls.regular;
    }
    
    // Fallback absoluto se a busca retornar vazio
    return "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  } catch (erro) {
    console.error("[Unsplash] Falha ignorada, usando fallback:", erro);
    return "https://images.unsplash.com/photo-1593062096033-9a26b09da705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  }
}
