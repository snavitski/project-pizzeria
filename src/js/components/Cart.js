import { settings, select, classNames, templates } from "./settings.js";
import utils from "./utils.js";
import CartProduct from "./CartProduct.js";

class Cart {
	constructor(element) {
		const thisCart = this;
		thisCart.products = [];
		thisCart.getElements(element);
		thisCart.initAction();
		//console.log("newCart", thisCart);
	}
	getElements(element) {
		const thisCart = this;
		thisCart.dom = {};
		thisCart.dom.wrapper = element;
		thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
			select.cart.toggleTrigger
		);
		thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
			select.cart.productList
		);
		thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
			select.cart.deliveryFee
		);
		thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
			select.cart.subtotalPrice
		);
		thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
			select.cart.totalPrice
		);
		thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
			select.cart.totalNumber
		);
		thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
		thisCart.dom.address = thisCart.dom.wrapper.querySelector(
			select.cart.address
		);
		thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
	}
	initAction() {
		const thisCart = this;
		thisCart.dom.toggleTrigger.addEventListener("click", function () {
			thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
		});
		thisCart.dom.productList.addEventListener("update", function () {
			thisCart.update();
		});
		thisCart.dom.productList.addEventListener("remove", function () {
			thisCart.remove(event.detail.cartProduct);
		});
		thisCart.dom.form.addEventListener("submit", function (event) {
			event.preventDefault();
			thisCart.sendOrder();
		});
	}
	add(menuProduct) {
		console.log("menuProduct", menuProduct);
		const thisCart = this;
		const generatedHTML = templates.cartProduct(menuProduct);
		const generateDom = utils.createDOMFromHTML(generatedHTML);
		thisCart.dom.productList.appendChild(generateDom);
		thisCart.products.push(new CartProduct(menuProduct, generateDom));
	}
	update() {
		const thisCart = this;
		thisCart.deliveryFee = 0;
		thisCart.totalNumber = 0;
		thisCart.subtotalPrice = 0;
		for (const product of thisCart.products) {
			thisCart.totalNumber = thisCart.totalNumber + product.amount;
			thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
		}
		if (thisCart.initActiontotalNumber !== 0) {
			thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
		}
		thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
		thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
		thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
		thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
		for (const totalPrice of thisCart.dom.totalPrice) {
			totalPrice.innerHTML = thisCart.totalPrice;
		}
	}
	remove(removedProduct) {
		const thisCart = this;
		const indexOfremovedProduct = thisCart.products.indexOf(removedProduct);
		removedProduct.dom.wrapper.remove();
		thisCart.products.splice(indexOfremovedProduct, 1);
		thisCart.update();
	}
	sendOrder() {
		const thisCart = this;
		const url = settings.db.url + "/" + settings.db.orders;
		let playload = {};
		console.log.apply(playload);
		playload.address = thisCart.dom.address.value;
		playload.phone = thisCart.dom.phone.value;
		playload.totalPrice = thisCart.totalPrice;
		playload.subtotalPrice = thisCart.subtotalPrice;
		playload.totalNumber = thisCart.totalNumber;
		playload.deliveryFee = thisCart.deliveryFee;
		playload.products = [];
		for (let prod of thisCart.products) {
			playload.products.push(prod.getData());
		}
		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(playload),
		};
		fetch(url, options);
	}
}

export default Cart;
