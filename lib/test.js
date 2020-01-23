import { strict as assert } from 'assert';
import {
	Marketplace, rand, naive_sales, Consumer, Producer, 
	Widget, naive_pricing
} from './market.js'

const assertEqual = (actual, expected) => {
	assert(
		expected === actual, 
		`\nExpected:\n${expected}\n\nActual:\n${actual}`
	)
}

const assertAlmostEqual = (actual, expected) => {
	const wiggle_room = 0.000000001
	assert(
		expected - wiggle_room < actual && expected + wiggle_room > actual,
		`\nExpected:\n${expected}\n\nActual:\n${actual}`
	)
}

const sumof = (prop) => (sum, obj) => {
	// this works because null + 1 === 1
	return sum + obj[prop]
}

// test assets

const producers_01_to_03 = [
	new Producer({id: 0, min_price: 0.1}),
	new Producer({id: 1, min_price: 0.2}),
	new Producer({id: 2, min_price: 0.3}),
]

const widgets_1_to_9 = [
	new Widget({id: 4, price: 0.1, producer: producers_01_to_03[0]}),
	new Widget({id: 5, price: 0.1, producer: producers_01_to_03[0]}),
	new Widget({id: 6, price: 0.1, producer: producers_01_to_03[0]}),
	new Widget({id: 7, price: 0.3, producer: producers_01_to_03[1]}),
	new Widget({id: 8, price: 0.3, producer: producers_01_to_03[1]}),
	new Widget({id: 9, price: 0.3, producer: producers_01_to_03[1]}),
	new Widget({id: 10, price: 0.6, producer: producers_01_to_03[2]}),
	new Widget({id: 11, price: 0.6, producer: producers_01_to_03[2]}),
	new Widget({id: 12, price: 0.6, producer: producers_01_to_03[2]}),
]

const comsumers_04_x_5 = [
	new Consumer({id: 13, max_price: 0.4}),
	new Consumer({id: 14, max_price: 0.4}),
	new Consumer({id: 15, max_price: 0.4}),
	new Consumer({id: 16, max_price: 0.4}),
	new Consumer({id: 17, max_price: 0.4}),
]

const consumers_025_to_029 = [
	new Consumer({id: 18, max_price: 0.25}),
	new Consumer({id: 19, max_price: 0.26}),
	new Consumer({id: 20, max_price: 0.27}),
	new Consumer({id: 21, max_price: 0.28}),
	new Consumer({id: 22, max_price: 0.29}),
]

const tests = {
	test_naive_sales() {
		const widgets = widgets_1_to_9
		let consumers = comsumers_04_x_5

		let sales = naive_sales({consumers, widgets})

		// there are 5 widgets <= 0.4 price
		assertEqual(sales.length, 5) 

		consumers = consumers_025_to_029
		sales = naive_sales({consumers, widgets})

		// only 3 widgets available at price below 0.3
		assertEqual(sales.length, 3) 
	},
	test_naive_pricing(){
		const widgets = widgets_1_to_9

		// test with no sales
		let sales = []
		const new_inv_nosales = naive_pricing({widgets, sales})

		// first producer (3 widgets) is at min price and exits market.
		assertEqual(new_inv_nosales.length, widgets_1_to_9.length - 3)
		
		//	the rest reduce their prices by 0.01
		let total_price = new_inv_nosales.reduce(sumof('price'), 0)
		let original_price = widgets.slice(3).reduce(sumof('price'), 0)
		assertAlmostEqual(original_price - total_price, 0.01 * 6)


		// test with 6 sales
		let consumers = comsumers_04_x_5.concat(consumers_025_to_029)
		sales = naive_sales({consumers, widgets})
		const new_inv_6_sales = naive_pricing({widgets, sales})

		// everyone has inventory
		assertEqual(new_inv_6_sales.length, widgets_1_to_9.length)

		// first two producers raise prices by 0.01, last lowers prices
		total_price = new_inv_6_sales.reduce(sumof('price'), 0)
		original_price = widgets.reduce(sumof('price'), 0)
		assertAlmostEqual(original_price - total_price, -0.01 * 3)


		// test with 5 sales
		consumers = comsumers_04_x_5
		sales = naive_sales({consumers, widgets})
		const new_inv_5_sales = naive_pricing({widgets, sales})

		// everyone has inventory
		assertEqual(new_inv_5_sales.length, widgets_1_to_9.length)

		// one producer raises prices and another lowers prices
		total_price = new_inv_5_sales.reduce(sumof('price'), 0)
		original_price = widgets.reduce(sumof('price'), 0)
		assertAlmostEqual(original_price - total_price, 0)
	},
	test_marketplace_default() {
		const n_cons = 10
		const n_prod = 10
		const w_per_p = 1
		const market = new Marketplace({
			n_consumers: n_cons,
			n_producers: n_prod, 
			widgets_per_producer: w_per_p,
		})
		const n_widg = n_prod * w_per_p

		assertEqual(Object.values(market.widgets).length, n_widg)
		assertEqual(market.market_iterations.length, 1)

		const start_widgets = Object.values(market.widgets)
		const start_producers = Object.values(market.producers)

		const widget_prices = start_widgets.reduce(sumof('price'), 0)
		const producer_prices = start_producers.reduce(sumof('min_price'), 0)

		assert(
			widget_prices >= n_widg * 0.25,
			"min widget value is 0.25"
		)
		
		assert(
			widget_prices <= n_widg * 1,
			"max widget value is 1"
		)
		
		assert(
			widget_prices > producer_prices * w_per_p,
			"producers always price widgets above their min_price"
		)

		const first_iter = market.last_market_iteration()
		assert(
			first_iter.total_surplus() > 0,
			"no surplus is vanishingly improbable"
		)
		assert(
			first_iter.total_surplus() < n_cons,
			"surplus of more than 1 per consumer is impossible"
		)

		for (let i = 100; i > 0; --i){
			market.iterate_market()
		}
		const final_iter = market.last_market_iteration()
		debugger
		assert(
			first_iter.total_surplus() < final_iter.total_surplus(),
			"vanishingly improbable for total surplus not to increase"
		)
	},
}

Object.keys(tests).forEach((test_name) => {
	tests[test_name]()
	console.log('✓', test_name)
})