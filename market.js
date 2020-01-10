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
		})
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
	
	const sorted_widgets = Object.values(widgets).sort((w1, w2) => {
		return w2.prices - w1.price
	})

	const shuffled_consumers = Object.values(consumers)
	shuffle_inplace(shuffled_consumers)

	const sales = []

	shuffled_consumers.forEach((consumer) => {
		const last_widget = sorted_widgets.pop()

		if (last_widget.price < consumer.max_price) {
			sales.push({consumer: consumer, widget: last_widget})
		} else {
			sorted_widgets.push(last_widget)
		}
	})

	return sales
}

const naive_pricing = ({}) => {
	return 'TODO'
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

		Object.values(this.producers).forEach((producer) => {
			const price = rand(producer.min_price, 1)
			stop = this.idx + widgets_per_producer
			for (; this.idx < stop; this.idx++) {
				this.index[this.idx] = new Widget({
					id: this.idx, 
					producer: producer, 
					price: price
				})
				this.widgets[this.idx] = this.index[this.idx]
			}
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

	last_market_iteration() {
		return this.market_iterations[this.market_iterations.length - 1]
	}

	iterate_market() {

	}

	replenish_inventory() {
		const market_iter = this.last_market_iteration

	}
}

export { Marketplace, rand }

// new_inventory(market_iteration, pricing_strategy) {
// 	market_iteration.sales.forEach((sale) => {
// 		producer_sales[]
// 	})
// }

// const make_sales_naive = (consumers, producers) => {
// 	// shuffle before calling this fntion
// 	return consumers.map((consumer, i) => {
// 		Sale(consumer, producers[i % producers.length])
// 	})
// }

// const market_adjusted_producers = (producers) => {
// 	// producers adjust their prices.
// 	// producers who can't make sales or lower prices exit the market

// 	const adjusted_producers = []

// 	producers.forEach((producer) => {
// 		const new_price = producer.new_price()
// 		if (new_price !== null) {
// 			producer.price = new_price
// 			adjusted_producers.push(producer)
// 		}
// 	})

// 	return adjusted_producers
// }

// const simul = (consumers, producers, iters) => {
// 	let all_participants = [...consumers, ...producers]
// 	const n_consumers = consumers.length
// 	const n_producers = producers.length

// 	for (let i = 0; i < iters; i++) {
// 		match_sales(consumers, producers)
// 		producers = market_adjusted_producers(producers)
// 	}

// 	return [consumers, producers, all_participants]
// }

// const main = (market_size, iters) => {
// 	let consumers = []
// 	let producers = []
// 	for (let i = 0; i < market_size; i++) {
// 		// consumers and producers with uniform price distribution
// 		consumers.push(new Consumer(rand(0.1, 0.9)))
// 		producers.push(new Producer(rand(0.1, 0.9)))
// 	}
// 	consumers, producers, everyone = simul(consumers, producers, iters)

// 	const total_surplus = everyone.map(

// 	)
// 	console.log('\nConsumer surplus\n', )
// 	console.log('\nPRODUCERS\n', producers)
// }

// main(5, 100)