const express = require('express');
const multer = require('multer');
const cors = require('cors');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('frontend'));

const upload = multer({ dest: 'uploads/' });

// Função para extrair a quantidade total de unidades da embalagem
function calcularQtdDaEmbalagem(embalagem) {
  if (!embalagem) return 1;
  const match = embalagem.match(/(\d+)\s*[xX]\s*(\d+)/);
  if (match) {
    const mult1 = parseInt(match[1]);
    const mult2 = parseInt(match[2]);
    return mult1 * mult2;
  }
  return 1;
}

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = 'Rebaixa';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 2
     });

    console.log('Colunas detectadas:', Object.keys(jsonData[0] || {}));
    console.log('Exemplo de linha:', jsonData[0]);

    const posters = jsonData
      .filter(row => parseFloat(row[' Margen ']) < 0)
      .map((row, index) => {
  const precoUnit = parseFloat((row[' preço '] || '').toString().replace(',', '.')) || 0;
  const qtdCaixa = calcularQtdDaEmbalagem(row['Embalagem']);
  const descricaoProduto = row['Descrição'] || '';

  // Depuração no terminal:
  console.log(`Linha ${index + 1}:`, {
    codigo: row['codigo '],
    descricao: descricaoProduto,
    margem: row[' Margen '],
  });

  return {
    id: index,
    codigo: row['codigo '] || '',
    produto: descricaoProduto,
    embalagem: row['Embalagem'] || '',
    validade: row['Validade'] || '',
    precoUnit: precoUnit.toFixed(2),
    qtdCaixa: qtdCaixa,
    precoCaixa: (precoUnit * qtdCaixa).toFixed(2),
    margem: row[' Margen '] || '',
    tamanho: 'A4'
  };
});


    fs.unlinkSync(filePath);
    res.json(posters);
  } catch (err) {
    console.error('Erro ao ler planilha:', err);
    res.status(500).json({ error: 'Erro ao processar o arquivo' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));


