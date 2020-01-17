const rand = (min, max) => {
	min = min ? min : 0
	max = max ? max : 1
	return Math.random() * (max - min) + min
}

// fisher-yates
const shuffle_inplace = (array) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * i)
		const temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
}

const wiggle = (n, amt) => {
	const m = amt === null ? 0.1 : amt
	return n + rand(-m, m) * n
}

class Consumer{
	constructor({id, max_price}) {
		this.id = id
		this.max_price = max_price
	}
}

class Producer{
	constructor({id, min_price}) {
		this.id = id
		this.min_price = min_price
	}
}

class Widget{
	constructor({id, producer, price}) {
		this.id = id
		this.price = price
		this.producer = producer
	}
}

class Sale{
	constructor({consumer, widget}) {
		this.consumer = consumer
		this.widget = widget
	}

	consumer_surplus() {
		return this.consumer.max_price - this.widget.price
	}

	producer_surplus() {
		return this.widget.price - this.widget.producer.min_price 
	}

	total_surplus() {
		return this.consumer_surplus() + this.producer_surplus()
	}
}

class MarketIteration{
	constructor({gen, producers, consumers, widgets, sales_fn}) {
		this.gen = gen
		this.producers = producers
		this.consumers = consumers
		this.widgets = widgets
		this.sales = sales_fn({consumers, widgets})
	}

	total_surplus() {
		return this.sales.reduce((total, sale) => {
			return total + sale.total_surplus()
		}, 0)
	}

	sales_by_producer_id() {
		producer_sales = {}
		this.sales.forEach((sale) => {
			const producer_id = sale.widget.producer.id
			if (producer_sales[producer_id] === null) {
				this.producer_sales[producer_id] = []
			}
			producer_sales[producer_id].push(sale)
		})
	}
}

const naive_sales = ({consumers, widgets}) => {
	// consumers act in a random order, picking the cheapest
	//	available widget, and buying it if it is below their max
	
	// most expensive first, so pop() returns least expensive
	const sorted_widgets = Object.values(widgets).sort((w1, w2) => {
		return w2.price - w1.price
	})
	const shuffled_consumers = Object.values(consumers)
	shuffle_inplace(shuffled_consumers)

	if (shuffled_consumers.length === 0 || sorted_widgets.length === 0)
		return []

	const sales = []

	shuffled_consumers.forEach((consumer) => {
		const last_widget = sorted_widgets.pop()
		if (last_widget.price <= consumer.max_price) {
			sales.push(new Sale({
				consumer: consumer,
				widget: last_widget
			}))
		} else {
			sorted_widgets.push(last_widget)
		}
	})

	return sales
}

const producer_sales_summary = ({widgets, sales}) => {
	const producer_data = {}
	Object.values(widgets).forEach(widget => {
		const producer = widget.producer
		const pid = producer.id
		producer_data[pid] = producer_data[pid] || {
			producer: producer,
			widgets: [],
			sales: [],
		}
		producer_data[pid]['widgets'].push(widget)
	})

	sales.forEach(sale => {
		const pid = sale.widget.producer.id
		producer_data[pid]['sales'].push(sale)
	})

	return producer_data
}

const naive_pricing = ({widgets, sales, next_id}) => {
	// for each producer, create a new inventory
	let id = next_id

	const producer_data = producer_sales_summary({widgets, sales})
	const new_widgets = []

	Object.values(producer_data).forEach(producer_sales => {
		const {producer, widgets, sales} = producer_sales

		let new_price = widgets[0].price

		// if all widgets sold, raise prices
		if (widgets.length === sales.length) {
			new_price = Math.min(1.0, new_price + 0.01)
		// if no widgets sold, lower prices
		} else if (sales.length === 0) {
			new_price = Math.max(producer.min_price, new_price - 0.01)
		}

		// if a producer is down to minimum price, limit production
		const new_n = new_price === producer.min_price ? 
						sales.length : widgets.length

		for (let i=new_n; i>0; i--) {
			new_widgets.push(new Widget({
				producer: producer,
				price: new_price,
				id: next_id++,
			}))
		}
	})

	return new_widgets
}

class Marketplace{
	constructor({n_consumers, consumer_price_fn, n_producers, 
				producer_price_fn, widgets_per_producer,
				pricing_fn, sales_fn}) {
		const random_price = () => rand(0.25, 0.75)

		this.n_consumers = n_consumers
		this.n_producers = n_producers
		this.widgets_per_producer = widgets_per_producer
		
		this.consumer_price_fn = consumer_price_fn || random_price
		this.producer_price_fn = producer_price_fn || random_price
		this.sales_fn = sales_fn || naive_sales
		this.pricing_fn = pricing_fn || naive_pricing

		this.idx = 0
		this.index = {}

		this.consumers = {}
		this.producers = {}
		this.widgets = {}
		this.market_iterations = []

		let stop = this.idx + n_consumers
		for (; this.idx < stop; this.idx++) {
			this.index[this.idx] = new Consumer({
				id: this.idx, 
				max_price: this.consumer_price_fn()
			})
			this.consumers[this.idx] = this.index[this.idx]
		}
		
		stop = this.idx + n_producers
		for (; this.idx < stop; this.idx++) {
			this.index[this.idx] = new Producer({
				id: this.idx, 
				min_price: this.producer_price_fn()
			})
			this.producers[this.idx] = this.index[this.idx]
		}

		this.widgets = this.producer_starting_inventory({
			producers: this.producers,
			widgets_per_producer: this.widgets_per_producer,
		})

		this.market_iterations.push(
			new MarketIteration({
				gen: 0, 
				producers: this.producers, 
				consumers: this.consumers, 
				widgets: this.widgets, 
				sales_fn: this.sales_fn,
			})
		)
		
		// console.log('consumers', this.consumers)
		// console.log('producers', this.producers)
		// console.log('widgets', this.widgets)
		// console.log('market_iterations', this.market_iterations)
	}

	producer_starting_inventory({producers, widgets_per_producer}) {
		const widgets = {}
		Object.values(producers).forEach((producer) => {
			// default to value-based pricing @ 25% markup
			//	wiggle adds +/- 10%
			const price = Math.min(wiggle(producer.min_price * 1.25), 1)
			const stop = this.idx + widgets_per_producer
			for (; this.idx < stop; this.idx++) {
				this.index[this.idx] = new Widget({
					id: this.idx, 
					producer: producer, 
					price: price,
				})
				widgets[this.idx] = this.index[this.idx]
			}
		})
		return widgets
	}

	last_market_iteration() {
		return this.market_iterations[this.market_iterations.length - 1]
	}

	iterate_market() {
		const last_iter = this.last_market_iteration()
		const last_widgets = last_iter.widgets
		const last_sales = last_iter.sales

		let next_inventory = naive_pricing({
			widgets: last_widgets,
			sales: last_sales,
			id: this.idx,
		})

		Object.assign(this.index, next_inventory)
		Object.assign(this.widgets, next_inventory)
		this.idx += next_inventory.length

		const next_market_iter = new MarketIteration({
			gen: last_iter.gen + 1, 
			producers: this.producers, 
			consumers: this.consumers, 
			widgets: next_inventory, 
			sales_fn: this.sales_fn,
		})
	}

	replenish_inventory() {
		const market_iter = this.last_market_iteration

	}
}

export { 
	Marketplace, 
	Consumer, 
	Producer, 
	Widget, 
	Sale, 
	rand, 
	naive_sales,
	naive_pricing,
}
