function App() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          CotaCerta
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Gestão simples de caixinhas coletivas
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Controle cotistas, cotas mensais, pagamentos Pix, comprovantes,
          quem está devendo, empréstimos e fechamento anual sem depender de papel.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <strong className="text-slate-900">Quem deve</strong>
            <p className="mt-2 text-sm text-slate-600">
              Visualize pendências por caixinha.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <strong className="text-slate-900">Pix e comprovantes</strong>
            <p className="mt-2 text-sm text-slate-600">
              Registre pagamentos e organize comprovantes.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <strong className="text-slate-900">Cotistas</strong>
            <p className="mt-2 text-sm text-slate-600">
              Cada participante acompanha sua própria situação.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
