const pdfForm = document.getElementById("pdfForm");
const pdfFile = document.getElementById("pdfFile");
const loading = document.getElementById("loading");
const output = document.getElementById("output");
const downloadXlsx = document.getElementById("downloadXlsx");
const modelSelect = document.getElementById('modelSelect');
let extractedData = [];

pdfForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.innerHTML = "";
  loading.classList.remove("d-none");

  const selectedMunicipio = modelSelect.value;

  const file = pdfFile.files[0];
  if (!file) {
    alert("Por favor, selecione um arquivo PDF.");
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = async (e) => {
    const typedArray = new Uint8Array(e.target.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    extractedData = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str).join(" ");

      const municipio = detectMunicipio(text, selectedMunicipio);

      let nome, endereco, valor;

      if (municipio === "Parintins") {
        nome = extractNomeParintins(text) || "Não encontrado";
        endereco = extractEnderecoParintins(text) || "Não encontrado";
        valor = extractValorParintins(text) || "Não encontrado";
      } else if (municipio === "Uruburetama") {
        nome = extractNomeUruburetama(text) || "Não encontrado";
        endereco = extractEnderecoUruburetama(text) || "Não encontrado";
        valor = extractValorUruburetama(text) || "Não encontrado";
      } else {
        nome = "Não identificado";
        endereco = "Não identificado";
        valor = "Não identificado";
      }

      extractedData.push({ page: i, municipio, nome, endereco, valor });

      const paragraph = document.createElement("p");
      paragraph.textContent = `Página ${i} (${municipio}): Nome: ${nome}, Endereço: ${endereco}, Valor: ${valor}`;
      output.appendChild(paragraph);
    }

    loading.classList.add("d-none");
    downloadXlsx.classList.remove("d-none");
  };

  fileReader.readAsArrayBuffer(file);
});

downloadXlsx.addEventListener("click", () => {
  const ws = XLSX.utils.json_to_sheet(extractedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados Extraídos");
  XLSX.writeFile(wb, "dados_extraidos.xlsx");
});

function detectMunicipio(text, selectedMunicipio) {
  if (selectedMunicipio === "uruburetama" || text.includes("Prefeitura Municipal de Uruburetama")) {
    return "Uruburetama";
  }
  if (selectedMunicipio === "parintins" || text.includes("Prefeitura Municipal de Parintins")) {
    return "Parintins";
  }
  return "Desconhecido";
}

function extractNomeParintins(text) {
  const match = text.match(/Compl:\s+\d{3}\.\d{3}\.\d{3}-\d{2}\s+([A-Za-zÀ-ÿ\s]+)\s+DEMONSTRATIVO DA/);
  return match ? match[1].trim() : null;
}

function extractEnderecoParintins(text) {
  const match = text.match(/Endereço:\s+(.*?)\s+Número:\s+(.*?)(?:\s+|$)/);
  if (match) {
    const rua = match[1].trim();
    const numero = match[2].trim();
    return `${rua}, Número: ${numero}`;
  }
  return null;
}

function extractValorParintins(text) {
  const match = text.match(/(?:\d{1,3}(?:\.\d{3})*,\d{2})\s+Parintins,.*?(\d{1,3}(?:\.\d{3})*,\d{2})$/);
  return match ? match[1].trim() : null;
}

function extractNomeUruburetama(text) {
  const matchAoSr = text.match(/AO SR\(A\)\.?\s+([A-Z\s]+),/);
  if (matchAoSr) {
    return matchAoSr[1].trim();
  }

  const matchGeneric = text.match(/[A-Z][A-Z\s]*,[^a-z]/);
  return matchGeneric ? matchGeneric[0].replace(',', '').trim() : null;
}

function extractEnderecoUruburetama(text) {
  const match = text.match(/(?:RUA|AVENIDA|TRAVESSA|ESTRADA).*?CEP: \d{2}\.\d{3}-\d{3}/i);
  return match ? match[0].trim() : null;
}

function extractValorUruburetama(text) {
  const match = text.match(/Totais:.*?(\d{1,3}(?:\.\d{3})*,\d{2})(?!.*\d{1,3}(?:\.\d{3})*,\d{2})/);
  return match ? match[1].trim() : null;
}
