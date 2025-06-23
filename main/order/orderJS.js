document.addEventListener('DOMContentLoaded', () => {
            // Referências aos elementos do DOM para o modal de adicionar ordem
            const addDialogOverlay = document.getElementById('add-dialog-overlay');
            const cancelAddBtn = document.querySelector('.cancel-add');
            const confirmAddBtn = document.querySelector('.confirm-add');
            const addDialogTextarea = document.querySelector('.add-dialog-textarea');
            const productGrid = document.getElementById('products-grid'); // Onde os cards são adicionados
            const addCardBtn = document.getElementById('add-card-btn'); // O botão flutuante de adicionar

            // Referências aos elementos do DOM para o popup de senha
            const passwordDialogOverlay = document.getElementById('password-dialog-overlay');
            const adminPasswordInput = document.getElementById('admin-password'); // ID corrigido para o HTML
            const confirmPasswordBtn = document.getElementById('confirm-password-btn');
            const cancelPasswordBtn = document.getElementById('cancel-password-btn');

            // Variáveis para armazenar a ação pendente e o elemento envolvido
            let pendingAction = null; // 'addNewOrder' ou 'deleteOrder'
            let pendingElement = null; // A referência para o card a ser deletado

            const ADMIN_PASSWORD = 'admin123'; // Senha de administrador

            // --- Funções para gerenciar os modais ---
            function openAddDialog() {
                addDialogOverlay.style.display = 'flex';
                addDialogTextarea.value = ''; // Limpa o textarea
                addDialogTextarea.focus(); // Foca no textarea
            }

            function closeAddDialog() {
                addDialogOverlay.style.display = 'none';
            }

            function openPasswordDialog(action, element = null) {
                pendingAction = action;
                pendingElement = element; // Armazena a referência para o card (para 'deleteOrder')
                adminPasswordInput.value = ''; // Limpa o campo da senha
                passwordDialogOverlay.style.display = 'flex';
                adminPasswordInput.focus();
            }

            function closePasswordDialog() {
                passwordDialogOverlay.style.display = 'none';
                pendingAction = null;
                pendingElement = null;
            }

            // --- Lógica dos botões ---

            // Botão Azul Flutuante (+) - Abre o pop-up de senha para adicionar
            addCardBtn.addEventListener('click', () => {
                openPasswordDialog('addNewOrder');
            });

            // Botão de Excluir (Lixeira) - Requer senha
            function handleDeleteClick(event) {
                // Guarda a referência para o card do produto a ser deletado
                const cardToDelete = event.currentTarget.closest('.product-card');
                openPasswordDialog('deleteOrder', cardToDelete);
            }

            // --- Popup de Senha ---
            confirmPasswordBtn.addEventListener('click', () => {
                const enteredPassword = adminPasswordInput.value;
                if (enteredPassword === ADMIN_PASSWORD) {
                    // Senha correta: executa a ação pendente
                    if (pendingAction === 'addNewOrder') {
                        closePasswordDialog(); // Fecha o popup da senha ANTES de abrir o outro modal
                        openAddDialog(); // Abre o modal de adicionar nova ordem
                    } else if (pendingAction === 'deleteOrder' && pendingElement) {
                        pendingElement.remove(); // Remove o card do produto
                        alert('Ordem de produção removida com sucesso!'); // Exibe mensagem de sucesso
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

            // Fechar o popup de senha clicando fora
            passwordDialogOverlay.addEventListener('click', (event) => {
                if (event.target === passwordDialogOverlay) {
                    closePasswordDialog();
                }
            });

            // --- Lógica do Modal de Adicionar Nova Ordem de Produção ---
            cancelAddBtn.addEventListener('click', closeAddDialog);

            // Fechar o modal de adicionar clicando fora
            addDialogOverlay.addEventListener('click', (event) => {
                if (event.target === addDialogOverlay) {
                    closeAddDialog();
                }
            });

            confirmAddBtn.addEventListener('click', () => {
                const newItemText = addDialogTextarea.value.trim();

                if (!newItemText) {
                    alert('Por favor, digite os detalhes da ordem de produção.');
                    return;
                }

                // Divide o texto por quebras de linha para criar múltiplos <li>
                const itemsArray = newItemText.split('\n').filter(line => line.trim() !== '');

                if (itemsArray.length === 0) {
                    alert('Por favor, digite os detalhes da ordem de produção.');
                    return;
                }
                
                const newCard = document.createElement('div');
                newCard.classList.add('product-card');

                let listItemsHtml = '';
                itemsArray.forEach(item => {
                    listItemsHtml += `<li>${item.trim()}</li>`;
                });

                newCard.innerHTML = `
                    <div class="card-header"></div>
                    <ul class="product-list">
                        ${listItemsHtml}
                    </ul>
                    <button class="delete-card-btn" data-action="delete-card" title="Excluir conjunto">
                        <img src="/pictures/trash.png" alt="Excluir">
                    </button>
                `;
                productGrid.appendChild(newCard);
                attachEventListenersToProductCard(newCard); // Anexa listeners para o novo card
                closeAddDialog(); // Fecha o modal de adicionar produto após o sucesso
                alert('Nova ordem de produção adicionada com sucesso!'); // Exibe mensagem de sucesso
            });

            // Adicionar um ouvinte de evento para o input de senha para detectar Enter
            adminPasswordInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Impede o comportamento padrão do Enter (ex: envio de formulário)
                    confirmPasswordBtn.click(); // Simula o clique no botão de confirmar
                }
            });

            // Adicionar um ouvinte de evento para o textarea de adição para detectar Enter e Shift+Enter
            addDialogTextarea.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    if (event.shiftKey) {
                        // Permite nova linha com Shift + Enter
                    } else {
                        event.preventDefault(); // Impede a quebra de linha padrão do Enter
                        confirmAddBtn.click(); // Simula o clique no botão de adicionar
                    }
                }
            });

            // --- Função para anexar event listeners a um card de produto ---
            function attachEventListenersToProductCard(cardElement) {
                const deleteBtn = cardElement.querySelector('.delete-card-btn');
                
                // Botão de deletar (lixeira)
                deleteBtn.addEventListener('click', handleDeleteClick);
            }

            // Anexar listeners para os cards de produto existentes ao carregar a página
            document.querySelectorAll('.product-card').forEach(attachEventListenersToProductCard);
        });