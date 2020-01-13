import { strict as assert } from 'assert';
import { 
	Marketplace, rand, naive_sales, Consumer, Widget 
} from './market.js'

const assertEqual = (actual, expected) => {
	assert(
		expected === actual, 
		`\nExpected:\n${expected}\n\nActual:\n${actual}`)
}

const tests = {
	test_naive_sales() {
		const widgets = [
			new Widget({id: 1, price: 0.1, producer: null}),
			new Widget({id: 2, price: 0.2, producer: null}),
			new Widget({id: 3, price: 0.3, producer: null}),
			new Widget({id: 4, price: 0.4, producer: null}),
			new Widget({id: 5, price: 0.5, producer: null}),
			new Widget({id: 6, price: 0.6, producer: null}),
			new Widget({id: 7, price: 0.7, producer: null}),
			new Widget({id: 8, price: 0.8, producer: null}),
			new Widget({id: 9, price: 0.9, producer: null}),
		]
		let consumers = [
			new Consumer({id: 11, max_price: 0.4}),
			new Consumer({id: 11, max_price: 0.4}),
			new Consumer({id: 11, max_price: 0.4}),
			new Consumer({id: 11, max_price: 0.4}),
			new Consumer({id: 11, max_price: 0.4}),
		]

		let sales = naive_sales({consumers, widgets})

		// there are four widgets <= 0.4 price
		assertEqual(sales.length, 4) 

		consumers = [
			new Consumer({id: 11, max_price: 0.25}),
			new Consumer({id: 11, max_price: 0.26}),
			new Consumer({id: 11, max_price: 0.27}),
			new Consumer({id: 11, max_price: 0.28}),
			new Consumer({id: 11, max_price: 0.29}),
		]

		sales = naive_sales({consumers, widgets})

		// only two widgets available at price below 0.3
		assertEqual(sales.length, 2) 
	},
	test_marketplace_defaults() {
		const market = new Marketplace({
			n_consumers: 100,
			n_producers: 10, 
			widgets_per_producer: 10,
		})


		assertEqual(Object.values(market.widgets).length, 10 * 10)
		assertEqual(market.market_iterations.length, 1)
		
		const first_iter = market.last_market_iteration()
		assert(
			first_iter.total_surplus() < 100,
			"surplus of more than 1 per consumer is impossible"
		)
	},
}

Object.keys(tests).forEach((test_name) => {
	tests[test_name]()
	console.log('✓', test_name)
})