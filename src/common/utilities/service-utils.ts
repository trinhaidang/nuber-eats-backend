import { OrderItem } from "src/orders/entities/order-item.entity";


export const setItemPrice = (item: OrderItem) => {
    if(!item) return;
    let optionPrice = 0;
    let optionNames = item.options.map(option => option.name);
    const chosenOptions = item.dish.options?.filter(option => optionNames.includes(option.name));
    chosenOptions?.map(option => optionPrice = optionPrice + option.extra);
    item.itemPrice = item.dish.price + optionPrice;
    return item;
}