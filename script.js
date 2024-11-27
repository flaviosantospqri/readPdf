const pdfForm = document.getElementById('pdfForm');
const pdfFile = document.getElementById('pdfFile');
const output = document.getElementById('output');
const loading = document.getElementById('loading');
const downloadXlsx = document.getElementById('downloadXlsx');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.worker.min.js';

let extractedData = []; 

pdfForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = pdfFile.files[0];

  if (!file) {
    alert('Por favor, selecione um arquivo PDF.');
    return;
  }

  output.innerHTML = '';
  extractedData = [];
  loading.classList.remove('d-none');
  downloadXlsx.classList.add('d-none');

  const fileReader = new FileReader();
  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str).join(' ');

      console.log(text);

      const nome = extractNome(text) || 'Não encontrado';
      const endereco = extractEndereco(text) || 'Não encontrado';
      const valor = extractValor(text) || 'Não encontrado';

      extractedData.push({ page: i, nome, endereco, valor });

      const paragraph = document.createElement('p');
      paragraph.textContent = `Página ${i}: Nome: ${nome}, Endereço: ${endereco}, Valor: ${valor}`;
      output.appendChild(paragraph);
    }

    loading.classList.add('d-none');
    downloadXlsx.classList.remove('d-none');
  };

  fileReader.readAsArrayBuffer(file);
});

function extractNome(text) {
  const matchAoSr = text.match(/AO SR\(A\)\.?\s+([A-Z\s]+),/);
  if (matchAoSr) {
    return matchAoSr[1].trim();
  }

  const matchGeneric = text.match(/[A-Z][A-Z\s]*,[^a-z]/);
  return matchGeneric ? matchGeneric[0].replace(',', '').trim() : null;
}

function extractEndereco(text) {
  const match = text.match(/(?:RUA|AVENIDA|TRAVESSA|ESTRADA).*?CEP: \d{2}\.\d{3}-\d{3}/i);
  return match ? match[0].trim() : null;
}
function extractValor(text) {
  const match = text.match(/Totais:.*?(\d{1,3}(?:\.\d{3})*,\d{2})(?!.*\d{1,3}(?:\.\d{3})*,\d{2})/);
  return match ? match[1].trim() : null;
}

downloadXlsx.addEventListener('click', () => {
  if (extractedData.length === 0) {
    alert('Nenhum dado encontrado para exportar.');
    return;
  }

  const formattedData = extractedData.map((entry) => ({
    Página: entry.page,
    Nome: entry.nome,
    Endereço: entry.endereco,
    Valor: entry.valor,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Extraídos');

  XLSX.writeFile(workbook, 'dados_extraidos.xlsx');
});
