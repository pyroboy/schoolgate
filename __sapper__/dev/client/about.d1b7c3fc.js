import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, Q as onMount, a as space, e as element, t as text, h as claim_space, c as claim_element, b as children, f as claim_text, g as detach_dev, l as add_location, m as insert_dev, o as append_dev, B as set_data_dev, n as noop } from './index.892efb91.js';
import { d as ApolloClient, c as gql } from './bundle.esm.0a1d9003.js';
import './_commonjsHelpers.e0f9ccb2.js';

/* src/routes/about.svelte generated by Svelte v3.16.0 */
const file = "src/routes/about.svelte";

function create_fragment(ctx) {
	let t0;
	let h1;
	let t1;
	let t2;
	let p;
	let t3;
	let t4;
	let div;
	let t5;
	let t6;

	const block = {
		c: function create() {
			t0 = space();
			h1 = element("h1");
			t1 = text("About this site");
			t2 = space();
			p = element("p");
			t3 = text("This is the 'about' page. There's not much here.");
			t4 = space();
			div = element("div");
			t5 = text("Random: ");
			t6 = text(/*random*/ ctx[0]);
			this.h();
		},
		l: function claim(nodes) {
			t0 = claim_space(nodes);
			h1 = claim_element(nodes, "H1", {});
			var h1_nodes = children(h1);
			t1 = claim_text(h1_nodes, "About this site");
			h1_nodes.forEach(detach_dev);
			t2 = claim_space(nodes);
			p = claim_element(nodes, "P", {});
			var p_nodes = children(p);
			t3 = claim_text(p_nodes, "This is the 'about' page. There's not much here.");
			p_nodes.forEach(detach_dev);
			t4 = claim_space(nodes);
			div = claim_element(nodes, "DIV", {});
			var div_nodes = children(div);
			t5 = claim_text(div_nodes, "Random: ");
			t6 = claim_text(div_nodes, /*random*/ ctx[0]);
			div_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "About";
			add_location(h1, file, 20, 0, 361);
			add_location(p, file, 22, 0, 387);
			add_location(div, file, 23, 0, 443);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, h1, anchor);
			append_dev(h1, t1);
			insert_dev(target, t2, anchor);
			insert_dev(target, p, anchor);
			append_dev(p, t3);
			insert_dev(target, t4, anchor);
			insert_dev(target, div, anchor);
			append_dev(div, t5);
			append_dev(div, t6);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*random*/ 1) set_data_dev(t6, /*random*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(h1);
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(p);
			if (detaching) detach_dev(t4);
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let random = 0;

	onMount(() => {
		const client = new ApolloClient();

		client.query({ query: gql`{ random }` }).then(result => {
			$$invalidate(0, random = result.data.random);
		});
	});

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("random" in $$props) $$invalidate(0, random = $$props.random);
	};

	return [random];
}

class About extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "About",
			options,
			id: create_fragment.name
		});
	}
}

export default About;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJvdXQuZDFiN2MzZmMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYWJvdXQuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdmVsdGU6aGVhZD5cblx0PHRpdGxlPkFib3V0PC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG48c2NyaXB0PlxuICBsZXQgcmFuZG9tID0gMDtcblxuICBpbXBvcnQgQXBvbGxvQ2xpZW50IGZyb20gJ2Fwb2xsby1ib29zdCc7XG5pbXBvcnQgZ3FsIGZyb20gJ2dyYXBocWwtdGFnJztcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgY29uc3QgY2xpZW50ID0gbmV3IEFwb2xsb0NsaWVudCgpO1xuXG4gIGNsaWVudC5xdWVyeSh7XG4gICAgcXVlcnk6IGdxbGB7IHJhbmRvbSB9YFxuICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgcmFuZG9tID0gcmVzdWx0LmRhdGEucmFuZG9tO1xuICB9KTtcbn0pO1xuPC9zY3JpcHQ+XG48aDE+QWJvdXQgdGhpcyBzaXRlPC9oMT5cblxuPHA+VGhpcyBpcyB0aGUgJ2Fib3V0JyBwYWdlLiBUaGVyZSdzIG5vdCBtdWNoIGhlcmUuPC9wPlxuPGRpdj5cbiAgUmFuZG9tOiB7cmFuZG9tfVxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0FDTSxNQUFNLEdBQUcsQ0FBQzs7Q0FNaEIsT0FBTztRQUNDLE1BQU0sT0FBTyxZQUFZOztFQUUvQixNQUFNLENBQUMsS0FBSyxHQUNWLEtBQUssRUFBRSxHQUFHLGdCQUNULElBQUksQ0FBQyxNQUFNO21CQUNaLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU07Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=