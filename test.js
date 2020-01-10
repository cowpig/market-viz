import { strict as assert } from 'assert';
import { Marketplace, rand } from './market.js'

const assertEqual = (actual, expected) => {
	assert(
		expected === actual, 
		`\nExpected:\n${expected}\n\nActual:\n${actual}`)
}

const tests = {
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

Object.keys(tests).forEach((test_name) => tests[test_name]())