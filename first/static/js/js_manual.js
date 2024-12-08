document.addEventListener('DOMContentLoaded', function () {
    let selectedItems = [];

    // 상품 카드 클릭 이벤트
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function () {
            const id = card.dataset.id;
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const maxQuantity = parseInt(card.dataset.quantity, 10);

            if (maxQuantity <= 0) {
                alert(`${name} 상품은 재고가 없습니다.`);
                return;
            }

            const existingItem = selectedItems.find(item => item.id === id);
            if (existingItem) {
                if (existingItem.quantity < maxQuantity) {
                    existingItem.quantity++;
                } else {
                    alert('재고가 부족합니다.');
                }
            } else {
                selectedItems.push({ id, name, price, quantity: 1, maxQuantity });
            }

            updateSelectedItems();
            updateTotalPrice();
        });
    });

    function updateSelectedItems() {
        const tableBody = document.querySelector('#selected-items tbody');
        tableBody.innerHTML = '';

        selectedItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>
                    <button class="decrease-quantity">-</button>
                    ${item.quantity}
                    <button class="increase-quantity">+</button>
                </td>
                <td>₩${(item.price * item.quantity).toLocaleString()}</td>
                <td><button class="remove-item">삭제</button></td>
            `;
            tableBody.appendChild(row);

            row.querySelector('.increase-quantity').addEventListener('click', () => {
                if (item.quantity < item.maxQuantity) {
                    item.quantity++;
                    updateSelectedItems();
                    updateTotalPrice();
                }
            });

            row.querySelector('.decrease-quantity').addEventListener('click', () => {
                if (item.quantity > 1) {
                    item.quantity--;
                    updateSelectedItems();
                    updateTotalPrice();
                }
            });

            row.querySelector('.remove-item').addEventListener('click', () => {
                selectedItems = selectedItems.filter(i => i.id !== item.id);
                updateSelectedItems();
                updateTotalPrice();
            });
        });
    }

    function updateTotalPrice() {
        const totalPrice = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
        document.querySelector('#total-price').textContent = totalPrice.toLocaleString();
    }

    document.querySelector('#checkout-button').addEventListener('click', () => {
        if (selectedItems.length === 0) {
            alert('선택된 상품이 없습니다.');
            return;
        }

        fetch('/first/manual/checkout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ items: selectedItems }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('결제가 완료되었습니다!');
                location.reload();
            } else {
                alert('결제 실패: ' + data.message);
            }
        })
        .catch(err => {
            console.error('결제 오류:', err);
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
