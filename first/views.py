from django.shortcuts import render, redirect, get_object_or_404
from .models import Inventory
from .forms import InventoryForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Inventory

# 재고 목록 보기
def inventory_list(request):
    items = Inventory.objects.all()
    return render(request, 'inventory_list.html', {'items': items})

# 재고 추가
def inventory_add(request):
    if request.method == 'POST':
        form = InventoryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('inventory_list')
    else:
        form = InventoryForm()
    return render(request, 'inventory_form.html', {'form': form})

# 재고 수정
def inventory_edit(request, pk):
    item = get_object_or_404(Inventory, pk=pk)
    if request.method == 'POST':
        form = InventoryForm(request.POST, instance=item)
        if form.is_valid():
            form.save()
            return redirect('inventory_list')
    else:
        form = InventoryForm(instance=item)
    return render(request, 'inventory_form.html', {'form': form})

# 재고 삭제
def inventory_delete(request, pk):
    item = get_object_or_404(Inventory, pk=pk)
    if request.method == 'POST':
        item.delete()
        return redirect('inventory_list')
    return render(request, 'inventory_confirm_delete.html', {'item': item})


# 키오스크 페이지 렌더링
def product_manual(request):
    items = Inventory.objects.all()  # 재고 데이터 가져오기
    return render(request, 'product_manual.html', {'items': items})

# 수동 결제
@csrf_exempt
def product_manual_checkout(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        for item in data['items']:
            inventory_item = Inventory.objects.get(name=item['name'])
            inventory_item.quantity -= item['quantity']
            inventory_item.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

# AI 결제 시스템 페이지 뷰
def product_auto(request):
    items = Inventory.objects.all()  # 재고 데이터 가져오기
    return render(request, 'product_auto.html', {'items': items})
