// Meu código JS
const addProductDialogOverlay = document.getElementById('add-product-dialog-overlay');
const newProductNameInput = document.getElementById('new-product-name');
const productImageUpload = document.getElementById('product-image-upload');
const imagePreview = document.getElementById('image-preview');
const newProductQuantityInput = document.getElementById('new-product-quantity');
const confirmAddProductBtn = document.getElementById('confirm-add-product');
const cancelAddProductBtn = document.getElementById('cancel-add-product');
const mainContainer = document.querySelector('main.main-container');
const addCardBtn = document.getElementById('add-card-btn');

// Elementos do popup de senha
const passwordDialogOverlay = document.getElementById('password-dialog-overlay');
const adminPasswordInput = document.getElementById('admin-password-input');
const confirmPasswordBtn = document.getElementById('confirm-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');

// Variáveis para armazenar a ação pendente e o elemento envolvido
let pendingAction = null; // 'addNewProduct' ou 'deleteProduct'
let pendingElement = null; // A linha do produto a ser deletada (para 'deleteProduct')

const ADMIN_PASSWORD = 'admin123'; // Senha de administrador

// --- Funções para gerenciar os modais ---
function openAddProductDialog() {
    addProductDialogOverlay.style.display = 'flex';
    newProductNameInput.value = '';
    productImageUpload.value = '';
    imagePreview.innerHTML = '<span>Pré-visualização da Imagem</span>';
    newProductQuantityInput.value = '0';
    newProductNameInput.focus();
}

function closeAddProductDialog() {
    addProductDialogOverlay.style.display = 'none';
}

function openPasswordDialog(action, element = null) {
    pendingAction = action;
    pendingElement = element; // Armazena a referência para o elemento (ex: a linha do produto a ser deletada)
    adminPasswordInput.value = ''; // Limpa o campo da senha
    passwordDialogOverlay.style.display = 'flex';
    adminPasswordInput.focus();
}

function closePasswordDialog() {
    passwordDialogOverlay.style.display = 'none';
    pendingAction = null;
    pendingElement = null;
}

// --- Função para enviar dados para o Node-RED ---
function sendToNodeRED(productId, newQuantity) {
    fetch('http://localhost:1880/api/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: productId,
            quantidade: newQuantity
        })
    }).then(res => res.json())
      .then(data => {
          console.log('Servidor respondeu:', data);
      }).catch(err => {
          console.error('Erro ao enviar para Node-RED:', err);
      });
}

// --- Lógica dos botões ---

// Botão Azul Flutuante (+)
addCardBtn.addEventListener('click', () => {
    openPasswordDialog('addNewProduct');
});

// Botões de Adicionar/Remover Quantidade
function handleQuantityChange(event) {
    const button = event.currentTarget;
    const productActions = button.closest('.product-actions');
    const quantityInput = productActions.querySelector('.quantity-input');
    const quantityValueSpan = productActions.querySelector('.quantity-value');
    const productRow = button.closest('.product-row');
    const productId = productRow.dataset.productId;
    
    const quantityToChange = parseInt(quantityInput.value);

    // Validação de input
    if (isNaN(quantityToChange) || quantityToChange <= 0) {
        alert('Por favor, digite uma quantidade válida (maior que 0).');
        quantityInput.value = 1; // Reseta o input mesmo em caso de erro de input
        return;
    }

    let currentQuantity = parseInt(quantityValueSpan.textContent);
    let newQuantity;

    if (button.classList.contains('btn-add')) {
        newQuantity = currentQuantity + quantityToChange;
        quantityValueSpan.textContent = newQuantity;
        sendToNodeRED(productId, newQuantity); // Envia para Node-RED
    } else if (button.classList.contains('btn-remove')) {
        if (currentQuantity - quantityToChange >= 0) {
            newQuantity = currentQuantity - quantityToChange;
            quantityValueSpan.textContent = newQuantity;
            sendToNodeRED(productId, newQuantity); // Envia para Node-RED
        } else {
            alert('Não é possível remover mais itens do que o estoque atual.');
        }
    }
    quantityInput.value = 1; // Reseta o input para 1 após a operação
}

// Botão de Excluir (Lixeira) - Requer senha
function handleDeleteClick(event) {
    // Guarda a referência para a linha do produto a ser deletada
    const productRowToDelete = event.currentTarget.closest('.product-row');
    openPasswordDialog('deleteProduct', productRowToDelete);
}

// --- Popup de Senha ---
confirmPasswordBtn.addEventListener('click', () => {
    const enteredPassword = adminPasswordInput.value;
    if (enteredPassword === ADMIN_PASSWORD) {
        // Senha correta: executa a ação pendente
        if (pendingAction === 'addNewProduct') {
            closePasswordDialog(); // Fecha o popup da senha ANTES de abrir o outro modal
            openAddProductDialog(); // Abre o modal de adicionar novo produto
        } else if (pendingAction === 'deleteProduct' && pendingElement) {
            const productIdToDelete = pendingElement.dataset.productId;
            pendingElement.remove(); // Remove a linha do produto
            sendToNodeRED(productIdToDelete, 0); // Envia para Node-RED com quantidade 0 para indicar remoção
            alert('Item removido com sucesso!'); // Exibe mensagem de sucesso
            closePasswordDialog(); // Fecha o popup da senha APÓS a remoção
        }
    } else {
        alert('Senha incorreta!'); // Exibe mensagem de senha incorreta
        adminPasswordInput.value = ''; // Limpa o campo da senha
        adminPasswordInput.focus();
    }
});

cancelPasswordBtn.addEventListener('click', () => {
    closePasswordDialog();
});

passwordDialogOverlay.addEventListener('click', (event) => {
    if (event.target === passwordDialogOverlay) {
        closePasswordDialog();
    }
});

// --- Lógica do Modal de Adicionar Novo Produto ---
cancelAddProductBtn.addEventListener('click', closeAddProductDialog);

addProductDialogOverlay.addEventListener('click', (event) => {
    if (event.target === addProductDialogOverlay) {
        closeAddProductDialog();
    }
});

productImageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização">`;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '<span>Pré-visualização da Imagem</span>';
    }
});

confirmAddProductBtn.addEventListener('click', () => {
    const productName = newProductNameInput.value.trim();
    const productImageFile = productImageUpload.files[0];
    const productQuantity = parseInt(newProductQuantityInput.value);

    if (!productName) {
        alert('Por favor, insira o nome do produto.');
        return;
    }
    if (!productImageFile) {
        alert('Por favor, selecione uma imagem para o produto.');
        return;
    }
    if (isNaN(productQuantity) || productQuantity < 0) {
        alert('Por favor, insira uma quantidade inicial válida (maior ou igual a 0).');
        return;
    }
    
    // Adiciona o novo produto
    const imageUrl = URL.createObjectURL(productImageFile);
    const productId = productName.toLowerCase().replace(/\s+/g, '-');

    const newProductRow = document.createElement('div');
    newProductRow.classList.add('product-row');
    newProductRow.dataset.productId = productId;
    newProductRow.innerHTML = `
        <div class="product-info">
            <div class="product-icon">
                <img src="${imageUrl}" alt="${productName}">
            </div>
            <div class="product-name">${productName}</div>
        </div>
        <div class="product-actions">
            <input type="number" class="quantity-input" value="1" min="1">
            <button class="action-btn btn-add" data-action="add" title="Adicionar ao estoque"></button>
            <button class="action-btn btn-remove" data-action="remove" title="Remover do estoque"></button>
            <div class="quantity-info">
                <span>QTD</span>
                <span class="quantity-value">${productQuantity}</span>
            </div>
            <button class="action-btn btn-delete" data-action="delete" title="Excluir produto">
                <img src="/pictures/trash.png" alt="Lixeira">
            </button>
        </div>
    `;
    mainContainer.appendChild(newProductRow);
    attachEventListenersToProductRow(newProductRow); // Anexa listeners para a nova linha
    closeAddProductDialog(); // Fecha o modal de adicionar produto após o sucesso
    alert('Novo produto adicionado com sucesso!'); // Exibe mensagem de sucesso

    sendToNodeRED(productId, productQuantity); // Envia o novo produto para o Node-RED
});

// --- Função para anexar event listeners a uma linha de produto ---
function attachEventListenersToProductRow(rowElement) {
    const addBtn = rowElement.querySelector('.btn-add');
    const removeBtn = rowElement.querySelector('.btn-remove');
    const deleteBtn = rowElement.querySelector('.btn-delete');
    
    // Botões de quantidade (adicionar/remover)
    addBtn.addEventListener('click', handleQuantityChange);
    removeBtn.addEventListener('click', handleQuantityChange);

    // Botão de deletar (lixeira)
    deleteBtn.addEventListener('click', handleDeleteClick);
}

// Anexar listeners para as linhas de produto existentes ao carregar a página
document.querySelectorAll('.product-row').forEach(attachEventListenersToProductRow);