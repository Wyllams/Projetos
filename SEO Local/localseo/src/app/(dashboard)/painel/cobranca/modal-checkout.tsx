"use client";

import { useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";
import { processarAssinaturaAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModalCheckout({
  isOpen,
  onClose,
  planoCorrente,
}: {
  isOpen: boolean;
  onClose: () => void;
  planoCorrente: { id: string; nome: string; preco: number } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [numeroEnd, setNumeroEnd] = useState("");

  const [cartaoNumero, setCartaoNumero] = useState("");
  const [cartaoNome, setCartaoNome] = useState("");
  const [cartaoValidade, setCartaoValidade] = useState("");
  const [cartaoCvv, setCartaoCvv] = useState("");

  if (!isOpen || !planoCorrente) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!planoCorrente) return;
      const splitValidade = cartaoValidade.split("/");
      const mes = splitValidade[0]?.trim();
      const ano = splitValidade[1]?.trim();

      if (!mes || !ano || ano.length !== 4) {
        toast.error("Formato de validade inválido. Use MM/AAAA");
        setLoading(false);
        return;
      }

      const res = await processarAssinaturaAction(
        planoCorrente!.id as any,
        planoCorrente!.preco,
        {
          holderName: cartaoNome,
          number: cartaoNumero.replace(/\D/g, ""),
          expiryMonth: mes,
          expiryYear: ano,
          ccv: cartaoCvv,
        },
        {
          nome,
          cpfCnpj: cpfCnpj.replace(/\D/g, ""),
          cep: cep.replace(/\D/g, ""),
          numeroEnd,
        }
      );

      if (res.sucesso) {
        toast.success("Assinatura confirmada com sucesso!");
        onClose();
        router.refresh();
      } else {
        toast.error(res.erro || "Falha ao processar pagamento.");
      }
    } catch (err) {
      toast.error("Erro inesperado ocorreu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Assinar Plano {planoCorrente.nome}</h2>
            <p className="text-sm text-muted-foreground">Valor: R$ {planoCorrente.preco}/mês</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                1. Dados de Faturamento
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nome Completo</label>
                  <input
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="João da Silva"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">CPF / CNPJ</label>
                  <input
                    required
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">CEP</label>
                    <input
                      required
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Número (Endereço)</label>
                    <input
                      required
                      value={numeroEnd}
                      onChange={(e) => setNumeroEnd(e.target.value)}
                      className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t my-4"></div>

            {/* Seção 2: Cartão */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                2. Cartão de Crédito <CreditCard className="w-4 h-4" />
              </h3>

              <div className="glass-card p-4 bg-muted/30 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Número do Cartão</label>
                  <input
                    required
                    value={cartaoNumero}
                    onChange={(e) => setCartaoNumero(e.target.value)}
                    className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nome Impresso no Cartão</label>
                  <input
                    required
                    value={cartaoNome}
                    onChange={(e) => setCartaoNome(e.target.value)}
                    className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="JOAO S SILVA"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Validade</label>
                    <input
                      required
                      value={cartaoValidade}
                      onChange={(e) => setCartaoValidade(e.target.value)}
                      className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="MM/AAAA"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">CVV</label>
                    <input
                      required
                      value={cartaoCvv}
                      onChange={(e) => setCartaoCvv(e.target.value)}
                      maxLength={4}
                      className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="123"
                      type="password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-muted"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            form="checkout-form"
            type="submit"
            disabled={loading}
            className="gradient-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </>
            ) : (
              "Confirmar Pagamento"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
