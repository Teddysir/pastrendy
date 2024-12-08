document.addEventListener('DOMContentLoaded', function () {
    const webcam = document.getElementById('webcam'); // 웹캠 비디오 요소
    const labelContainer = document.getElementById('label-container'); // 예측 결과를 표시할 컨테이너
    const selectedItems = []; // 선택된 상품 목록
    let model; // Teachable Machine 모델 객체

    // 카메라 및 모델 초기화 함수
    async function initialize() {
        try {
            console.log('카메라 초기화 중...');
            // 카메라 스트림 연결
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcam.srcObject = stream;
            console.log('카메라 초기화 성공');

            console.log('모델 로드 중...');
            // 모델 파일 로드 (templates/models 경로로 변경)
            model = await tmImage.load('/static/cachemodel/model.json', '/static/cachemodel/metadata.json');
            console.log('모델 로드 성공');

            classify(); // 실시간 상품 분류 시작
        } catch (error) {
            console.error('초기화 오류:', error);

            // 오류 메시지를 세분화하여 사용자에게 표시
            if (error.name === 'NotAllowedError') {
                alert('카메라 권한이 허용되지 않았습니다. 브라우저 설정을 확인하세요.');
            } else if (error.name === 'NotFoundError') {
                alert('카메라 장치가 감지되지 않습니다. 연결을 확인하세요.');
            } else if (error.message.includes('404')) {
                alert('모델 파일을 찾을 수 없습니다. 파일 경로를 확인하세요.');
            } else {
                alert('카메라 또는 모델을 로드하는 중 오류가 발생했습니다: ' + error.message);
            }
        }
    }

    // 실시간 상품 분류 함수
    async function classify() {
        if (!model) return; // 모델이 로드되지 않은 경우 함수 종료

        try {
            const predictions = await model.predict(webcam); // 웹캠 데이터를 모델에 전달
            const topPrediction = predictions[0]; // 가장 높은 확률의 예측 결과

            if (topPrediction && topPrediction.probability > 0.5) {
                const productName = topPrediction.className; // 상품 이름
                addProductToCart(productName); // 상품을 선택된 목록에 추가
            }
        } catch (error) {
            console.error('상품 분류 중 오류 발생:', error);
        }

        setTimeout(classify, 100); // 100ms 후 다시 실행
    }

    // 선택된 상품 목록에 추가
    function addProductToCart(productName) {
        const productCard = document.querySelector(`[data-name="${productName}"]`); // 상품 정보 확인

        if (!productCard) {
            console.warn(`상품 ${productName}을(를) 찾을 수 없습니다.`);
            return;
        }

        const id = productCard.dataset.id;
        const name = productCard.dataset.name;
        const price = parseFloat(productCard.dataset.price);
        const maxQuantity = parseInt(productCard.dataset.quantity, 10);

        if (maxQuantity <= 0) {
            alert(`${name} 상품의 재고가 없습니다.`);
            return;
        }

        const existingItem = selectedItems.find(item => item.id === id);
        if (existingItem) {
            if (existingItem.quantity < maxQuantity) {
                existingItem.quantity += 1;
            } else {
                alert(`${name} 상품의 재고가 부족합니다.`);
            }
        } else {
            selectedItems.push({ id, name, price, quantity: 1, maxQuantity });
        }

        updateSelectedItems();
        updateTotalPrice();
    }

    // 선택된 상품 목록 업데이트
    function updateSelectedItems() {
        const tableBody = document.querySelector('#selected-items tbody');
        tableBody.innerHTML = ''; // 기존 내용을 초기화

        selectedItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>
                    <button class="decrease-quantity">-</button>
                    ${item.quantity}
                    <button class="increase-quantity">+</button>
                </td>
                <td>₩${formatPrice(item.price * item.quantity)}</td>
                <td><button class="remove-item">삭제</button></td>
            `;
            tableBody.appendChild(row);

            // 수량 증가 버튼 이벤트
            row.querySelector('.increase-quantity').addEventListener('click', () => {
                if (item.quantity < item.maxQuantity) {
                    item.quantity += 1;
                    updateSelectedItems();
                    updateTotalPrice();
                } else {
                    alert('재고를 초과할 수 없습니다.');
                }
            });

            // 수량 감소 버튼 이벤트
            row.querySelector('.decrease-quantity').addEventListener('click', () => {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    updateSelectedItems();
                    updateTotalPrice();
                } else {
                    alert('수량은 1보다 적을 수 없습니다.');
                }
            });

            // 삭제 버튼 이벤트
            row.querySelector('.remove-item').addEventListener('click', () => {
                const index = selectedItems.indexOf(item);
                selectedItems.splice(index, 1);
                updateSelectedItems();
                updateTotalPrice();
            });
        });
    }

    // 총 가격 업데이트
    function updateTotalPrice() {
        const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        document.querySelector('#total-price').textContent = formatPrice(totalPrice);
    }

    // 가격을 포맷팅
    function formatPrice(price) {
        return price.toLocaleString(); // 숫자를 현지 통화 형식으로 표시
    }

    // 결제 버튼 이벤트
    document.querySelector('#checkout-button').addEventListener('click', async () => {
        if (selectedItems.length === 0) {
            alert('선택된 상품이 없습니다.');
            return;
        }

        try {
            const response = await fetch('/first/manual/checkout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ items: selectedItems }),
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('결제가 완료되었습니다!');
                selectedItems.length = 0; // 선택된 상품 목록 초기화
                updateSelectedItems();
                updateTotalPrice();
                location.reload();
            } else {
                alert(`결제 실패: ${data.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('결제 오류:', error);
            alert('결제 처리 중 오류가 발생했습니다.');
        }
    });

    // CSRF 토큰 가져오기
    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(`${name}=`)) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    }

    // 초기화 버튼 이벤트
    document.getElementById('initialize-button').addEventListener('click', initialize);

    // 초기화 호출
    initialize();
});
