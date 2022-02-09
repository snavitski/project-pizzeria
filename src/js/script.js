/* eslint-disable no-mixed-spaces-and-tabs */
/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	`use strict`;

	const select = {
		templateOf: {
			menuProduct: "#template-menu-product",
			cartProduct: "#template-cart-product", // CODE ADDED
		},
		containerOf: {
			menu: "#product-list",
			cart: "#cart",
		},
		all: {
			menuProducts: "#product-list > .product",
			menuProductsActive: "#product-list > .product.active",
			formInputs: "input, select",
		},
		menuProduct: {
			clickable: ".product__header",
			form: ".product__order",
			priceElem: ".product__total-price .price",
			imageWrapper: ".product__images",
			amountWidget: ".widget-amount",
			cartButton: `[href="#add-to-cart"]`,
		},
		widgets: {
			amount: {
				input: "input.amount", // CODE CHANGED
				linkDecrease: `a[href="#less"]`,
				linkIncrease: `a[href="#more"]`,
			},
		},
		// CODE ADDED START
		cart: {
			productList: ".cart__order-summary",
			toggleTrigger: ".cart__summary",
			totalNumber: `.cart__total-number`,
			totalPrice:
				".cart__total-price strong, .cart__order-total .cart__order-price-sum strong",
			subtotalPrice: ".cart__order-subtotal .cart__order-price-sum strong",
			deliveryFee: ".cart__order-delivery .cart__order-price-sum strong",
			form: ".cart__order",
			formSubmit: `.cart__order [type="submit"]`,
			phone: `[name="phone"]`,
			address: `[name="address"]`,
		},
		cartProduct: {
			amountWidget: ".widget-amount",
			price: ".cart__product-price",
			edit: `[href="#edit"]`,
			remove: `[href="#remove"]`,
		},
		// CODE ADDED END
	};

	const classNames = {
		menuProduct: {
			wrapperActive: "active",
			imageVisible: "active",
		},
		// CODE ADDED START
		cart: {
			wrapperActive: "active",
		},
		// CODE ADDED END
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 1,
			defaultMax: 9,
		}, // CODE CHANGED
		// CODE ADDED START
		cart: {
			defaultDeliveryFee: 20,
		},
		db: {
			url: "//localhost:3131",
			products: "products",
			orders: "orders",
		},
		// CODE ADDED END
	};

	const templates = {
		menuProduct: Handlebars.compile(
			document.querySelector(select.templateOf.menuProduct).innerHTML
		),
		// CODE ADDED START
		cartProduct: Handlebars.compile(
			document.querySelector(select.templateOf.cartProduct).innerHTML
		),
		// CODE ADDED END
	};
	class Product {
		constructor(id, data) {
			const thisProduct = this;
			thisProduct.id = id;
			thisProduct.data = data;
			thisProduct.renderInMenu();
			thisProduct.getElements();
			thisProduct.initAccordion();
			thisProduct.initOrderForm();
			thisProduct.initAmountWidget();
			thisProduct.processOrder();
			//console.log("new Product:", thisProduct);
		}
		renderInMenu() {
			const thisProduct = this;
			const generatedHTML = templates.menuProduct(thisProduct.data);
			thisProduct.element = utils.createDOMFromHTML(generatedHTML);
			const menuContainer = document.querySelector(select.containerOf.menu);
			menuContainer.appendChild(thisProduct.element);
		}
		getElements() {
			const thisProduct = this;
			thisProduct.accordionTrigger = thisProduct.element.querySelector(
				select.menuProduct.clickable
			);
			thisProduct.form = thisProduct.element.querySelector(
				select.menuProduct.form
			);
			thisProduct.formInputs = thisProduct.form.querySelectorAll(
				select.all.formInputs
			);
			thisProduct.cartButton = thisProduct.element.querySelector(
				select.menuProduct.cartButton
			);
			thisProduct.priceElem = thisProduct.element.querySelector(
				select.menuProduct.priceElem
			);
			thisProduct.imageWrapper = thisProduct.element.querySelector(
				select.menuProduct.imageWrapper
			);
			thisProduct.amountWidgetElem = thisProduct.element.querySelector(
				select.menuProduct.amountWidget
			);
		}
		initAccordion() {
			const thisProduct = this;

			thisProduct.accordionTrigger.addEventListener("click", function (event) {
				event.preventDefault();
				const activeProduct = document.querySelector(
					select.all.menuProductsActive
				);
				if (activeProduct != null && activeProduct != thisProduct.element) {
					activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
				}
				thisProduct.element.classList.toggle(
					classNames.menuProduct.wrapperActive
				);
			});
		}
		initOrderForm() {
			const thisProduct = this;
			thisProduct.form.addEventListener("submit", function (event) {
				event.preventDefault();
				thisProduct.processOrder();
			});

			for (let input of thisProduct.formInputs) {
				input.addEventListener("change", function () {
					thisProduct.processOrder();
				});
			}

			thisProduct.cartButton.addEventListener("click", function (event) {
				event.preventDefault();
				thisProduct.processOrder();
				thisProduct.addToCart();
			});
		}
		processOrder() {
			const thisProduct = this;

			// covert form to object structure e.g. { sauce: [`tomato`], toppings: [`olives`, `redPeppers`]}
			const formData = utils.serializeFormToObject(thisProduct.form);
			//console.log("formData", formData);

			// set price to default price
			let price = thisProduct.data.price;

			// for every category (param)...
			for (let paramId in thisProduct.data.params) {
				// determine param value, e.g. paramId = `toppings`, param = { label: `Toppings`, type: `checkboxes`... }
				const param = thisProduct.data.params[paramId];
				//console.log(paramId, param);

				// for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = `olives`, option = { label: `Olives`, price: 2, default: true }
					const option = param.options[optionId];
					//console.log(optionId, option);
					// chek if there is param with a name paramId in formData and if it includes optionId
					if (formData[paramId] && formData[paramId].includes(optionId)) {
						// chek if the option is not default
						if (option.default === true) {
							// add option price to price variable
							price += option.price;
						}
					} else {
						// check if the option is default
						if (!option.default === true) {
							// reduce price variable
							price -= option.price;
						}
					}
					const optionImage = thisProduct.imageWrapper.querySelector(
						`.${paramId}-${optionId}`
					);
					if (optionImage) {
						if (formData[paramId] && formData[paramId].includes(optionId)) {
							optionImage.classList.add(classNames.menuProduct.imageVisible);
						}
					}
				}
			}
			/* mutiply price by amount */
			price *= thisProduct.amountWidget.value;
			thisProduct.priceSingle = price;
			// update calculated price in the html
			thisProduct.priceElem.innerHTML = price;
		}
		initAmountWidget() {
			const thisProduct = this;
			thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
			thisProduct.amountWidgetElem.addEventListener("updated", function () {
				thisProduct.processOrder();
			});
		}
		addToCart() {
			const thisProduct = this;
			app.cart.add(thisProduct.prepareCartProduct());
		}
		prepareCartProduct() {
			const thisProduct = this;
			const productSummary = {};
			productSummary.id = thisProduct.id;
			productSummary.name = thisProduct.data.name;
			productSummary.amount = thisProduct.amountWidget.value;
			productSummary.priceSingle = thisProduct.priceSingle;
			productSummary.price = productSummary.amount * productSummary.priceSingle;
			productSummary.params = thisProduct.prepareCartProductParams();
			return productSummary;
		}
		prepareCartProductParams() {
			const thisProduct = this;
			const formData = utils.serializeFormToObject(thisProduct.form);
			const params = {};
			for (let paramId in thisProduct.data.params) {
				const param = thisProduct.data.params[paramId];
				params[paramId] = {
					label: param.label,
					options: {},
				};
				for (let optionId in param.options) {
					const option = param.options[optionId];
					const optionSelected =
						formData[paramId] && formData[paramId].includes(optionId);
					if (optionSelected) {
						params[paramId].options[optionId] = option.label;
					}
				}
				return params;
			}
		}
	}
	class AmountWidget {
		constructor(element) {
			const thisWidget = this;
			thisWidget.getElements(element);
			thisWidget.setValue(thisWidget.input.value);
			console.log("AmountWidget:", thisWidget);
			console.log("constructor arguments:", element);
		}
		getElements(element) {
			const thisWidget = this;
			thisWidget.element = element;
			thisWidget.input = thisWidget.element.querySelector(
				select.widgets.amount.input
			);
			thisWidget.linksDecrease = thisWidget.element.querySelector(
				select.widgets.amount.linkDecrease
			);
			thisWidget.linkIncrease = thisWidget.element.querySelector(
				select.widgets.amount.linkIncrease
			);
			thisWidget.value = settings.amountWidget.defaultValue;
		}
		setValue(value) {
			const thisWidget = this;
			const newValue = parseInt(value);
			/*TODO Add validation*/
			if (thisWidget.value !== newValue && !isNaN(newValue)) {
				thisWidget.value = newValue;
			}
			thisWidget.announce();
			thisWidget.input.value = thisWidget.value;
		}
		initAction() {
			const thisWidget = this;
			thisWidget.input.addEventListener("clik", function () {
				thisWidget.setValue(thisWidget.input.value);
			});
			thisWidget.linkDecrease.addEventListener("click", function (event) {
				event.preventDefault();
				thisWidget.setValue(thisWidget.value - 1);
			});
			thisWidget.linkIncrease.addEventListener("click", function (event) {
				event.preventDefault();
				thisWidget.setValue(thisWidget.value + 1);
			});
		}
		announce() {
			const thisWidget = this;
			const event = new CustomEvent("update", {
				bubbles: true,
			});
			thisWidget.element.dispatchEvent(event);
		}
	}
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
			thisCart.dom.phone = thisCart.dom.wrapper.querySelector(
				select.cart.phone
			);
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
	class CartProduct {
		constructor(menuProduct, element) {
			const thisCartProduct = this;
			thisCartProduct.id = menuProduct.id;
			thisCartProduct.name = menuProduct.name;
			thisCartProduct.amount = menuProduct.amount;
			thisCartProduct.priceSingle = menuProduct.priceSingle;
			thisCartProduct.price = menuProduct.price;
			thisCartProduct.params = menuProduct.params;
			thisCartProduct.getElements(element);
			thisCartProduct.initAmountWidget();
			thisCartProduct.initActions();
		}
		getElements(element) {
			const thisCartProduct = this;
			thisCartProduct.dom = {};
			thisCartProduct.dom.wrapper = element;
			thisCartProduct.dom.amountWidget = element.querySelector(
				select.cartProduct.amountWidget
			);
			thisCartProduct.dom.price = element.querySelector(
				select.cartProduct.price
			);
			thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
			thisCartProduct.dom.remove = element.querySelector(
				select.cartProduct.remove
			);
		}
		initAmountWidget() {
			const thisCartProduct = this;
			thisCartProduct.amountWidget = new AmountWidget(
				thisCartProduct.dom.amountWidget
			);
			thisCartProduct.dom.amountWidget.addEventListener("update", function () {
				thisCartProduct.amount = thisCartProduct.amountWidget.value;
				thisCartProduct.price =
					thisCartProduct.amount * thisCartProduct.priceSingle;
				thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
			});
		}
		initActions() {
			const thisCartProduct = this;
			thisCartProduct.dom.edit.addEventListener("click", function (event) {
				event.preventDefault();
			});
			thisCartProduct.dom.remove.addEventListener("click", function (event) {
				event.preventDefault();
				thisCartProduct.remove();
			});
		}
		remove() {
			const thisCartProduct = this;
			const event = new CustomEvent("remove", {
				bubbles: true,
				detail: {
					cartProduct: thisCartProduct,
				},
			});
			thisCartProduct.dom.wrapper.dispatchEvent(event);
		}
		getData() {
			const thisCartProduct = this;
			let productData = {};
			productData.id = thisCartProduct.id;
			productData.amount = thisCartProduct.amount;
			productData.price = thisCartProduct.price;
			productData.priceSingle = thisCartProduct.priceSingle;
			productData.name = thisCartProduct.name;
			productData.params = thisCartProduct.params;
			return productData;
		}
	}
	const app = {
		initMenu: function () {
			const thisApp = this;
			console.log("thisApp.data;", thisApp.data);
			for (let productData in thisApp.data.products) {
				new Product(productData, thisApp.data.products[productData]);
			}
		},
		initData: function () {
			const thisApp = this;
			thisApp.data = {};
			const url = settings.db.url + "/" + settings.db.products;
			fetch(url)
				.then(function (rawResponse) {
					return rawResponse.json();
				})
				.then(function (parsedResponse) {
					console.log("parsedResponse", parsedResponse);
					/* save parsedResponse as thisApp.data.product*/
					thisApp.data.products = parsedResponse;

					/* execute initMenu method */
					thisApp.initMenu();
				});
			console.log("thisApp.data", JSON.stringify(thisApp.data));
		},

		init: function () {
			const thisApp = this;
			console.log("*** App starting ***");
			console.log("thisApp:", thisApp);
			console.log("classNames:", classNames);
			console.log("settings:", settings);
			console.log("templates:", templates);
			thisApp.initData();
			thisApp.initCart();
		},
		initCart: function () {
			const thisApp = this;
			const cartElem = document.querySelector(select.containerOf.cart);
			thisApp.cart = new Cart(cartElem);
		},
	};
	app.init();
}
