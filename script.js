document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('loader').classList.remove('hidden');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    document.getElementById('loader').classList.add('hidden');
    renderPosters(data);
  } catch (error) {
    document.getElementById('loader').classList.add('hidden');
    alert('Erro ao processar arquivo.');
    console.error(error);
  }
});

function renderPosters(data) {
  const tbody = document.getElementById('posterList');
  tbody.innerHTML = '';

  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 text-center"><input type="checkbox" class="selectPoster" data-id="${item.id}"></td>
      <td class="p-2">${item.codigo}</td>
      <td class="p-2">${item.produto}</td>
      <td class="p-2">${item.embalagem}</td>
      <td class="p-2">${formatarData(item.validade)}</td>
      <td class="p-2">R$ ${item.precoUnit}</td>
      <td class="p-2">${item.qtdCaixa}</td>
      <td class="p-2">R$ ${item.precoCaixa}</td>
      <td class="p-2">${parseFloat(item.margem).toFixed(2)}%</td>
      <td class="p-2">
        <select class="tamanho-select" data-id="${item.id}">
          <option value="A2">A2</option>
          <option value="A3">A3</option>
          <option value="A4" selected>A4</option>
          <option value="A5">A5</option>
          <option value="A6">A6</option>
        </select>
      </td>
      <td class="p-2">
        <div class="poster size-A4" id="poster-${item.id}">
          ${gerarCartaz(item, 'A4')}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.tamanho-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const size = e.target.value;
      const posterEl = document.getElementById(`poster-${id}`);
      posterEl.className = `poster size-${size}`;
      const produto = data.find(p => p.id == id);
      posterEl.innerHTML = gerarCartaz(produto, size);
    });
  });

  document.getElementById('selectAll').onclick = () => {
    document.querySelectorAll('.selectPoster').forEach(cb => cb.checked = document.getElementById('selectAll').checked);
  }

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('#posterList tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

function formatarData(data) {
  const d = new Date(data);
  return isNaN(d) ? '' : d.toLocaleDateString('pt-BR');
}

function gerarCartaz(item, size) {
  return `
    <h1>OFERTA</h1>
    <h2>${item.produto.toUpperCase()}</h2>
    <div>${item.embalagem}</div>
    <div>Val: ${formatarData(item.validade)}</div>
    <div class="preco text-red-600">R$ ${item.precoUnit}</div>
    <div>Cx c/ ${item.qtdCaixa} - R$ ${item.precoCaixa}</div>`;
}

function exportToPDF() {
  const selecionados = document.querySelectorAll('.selectPoster:checked');
  if (!selecionados.length) return alert('Selecione ao menos um cartaz');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let current = 0;

  function renderNext() {
    if (current >= selecionados.length) {
      pdf.save('cartazes.pdf');
      return;
    }

    const id = selecionados[current].dataset.id;
    const el = document.getElementById(`poster-${id}`);

    html2canvas(el).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (current > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      current++;
      renderNext();
    });
  }
  renderNext();
}

function exportToPNG() {
  const selecionados = document.querySelectorAll('.selectPoster:checked');
  if (!selecionados.length) return alert('Selecione ao menos um cartaz');

  selecionados.forEach(el => {
    const id = el.dataset.id;
    const cartaz = document.getElementById(`poster-${id}`);
    html2canvas(cartaz).then(canvas => {
      const link = document.createElement('a');
      link.download = `cartaz-${id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  });
}
