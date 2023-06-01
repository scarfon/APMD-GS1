document.querySelector("#salvarbtn").addEventListener("click", salvar);

let despesas = [];
let ascValor = true;
let ascData = true;
let ascConsumo = true;

window.addEventListener("load", () => {
	despesas = JSON.parse(localStorage.getItem("despesas")) || [];
	atualizar();
});

function salvar(e) {
	e.preventDefault();
	const data = document.querySelector("#data-cadastro");
	const tipo = document.querySelector("#tipo-cadastro");
	const valor = document.querySelector("#valor-cadastro");
	const descricao = document.querySelector("#descricao-cadastro");
	const consumo = document.querySelector("#consumo-cadastro");
	const despesa = {
		id: Date.now(),
		data: data.value,
		tipo: tipo.value,
		valor: parseFloat(valor.value).toFixed(2).toString(),
		descricao: descricao.value,
		consumo: consumo.value,
	};
	if (
		!data.validity.valid ||
		!tipo.validity.valid ||
		!valor.validity.valid ||
		!descricao.validity.valid ||
		!consumo.validity.valid
	) {
		return;
	}
	despesas.push(despesa);
	atualizar();
	data.value = "";
	tipo.value = "";
	valor.value = "";
	descricao.value = "";
	consumo.value = "";
}

function validarNumero(valor) {
	const regex = /^\d+(?:\.?\d{0,2})$/;
	if (!regex.test(parseFloat(valor.value))) {
		valor.setCustomValidity("Valor inválido");
	} else {
		valor.setCustomValidity("");
	}
}

function atualizar() {
	localStorage.setItem("despesas", JSON.stringify(despesas));
	if (despesas.length === 0) {
		document.querySelector("#tabela").classList.add("oculta");
		document.querySelector("#relatorio").classList.add("oculta");
		document.querySelector("#tabela-totais").classList.add("oculta");
		document.querySelector("#tabela-info").classList.remove("oculta");
	} else {
		document.querySelector("#tabela").classList.remove("oculta");
		document.querySelector("#tabela-info").classList.add("oculta");
		document.querySelector("#relatorio").classList.remove("oculta");
		document.querySelector("#tabela-totais").classList.remove("oculta");
		document.querySelector("#tabela-corpo").innerHTML = "";
		despesas.forEach((despesa) => {
			document.querySelector("#tabela-corpo").innerHTML += criaDespesa(despesa);
		});
		criaTotal(despesas);
		criarGraficos(despesas);
	}
}

function criaDespesa(despesa) {
	return `
    <tr>
			<td>${despesa.data}</td>
			<td>${despesa.descricao}</td>
			<td>${despesa.tipo}</td>
			<td>R$ ${despesa.valor.replace(".", ",")}</td>
			<td>${despesa.consumo} m³</td>
			<td>
				<i onclick="editar(${despesa.id})" class="fa-solid fa-pencil"></i>
				<i onclick="deletar(${despesa.id})"class="fa-solid fa-trash"></i>
			</td>
		</tr>
  `;
}

function criaTotal(despesas) {
	const totalValor = despesas.reduce((acc, despesa) => {
		return acc + parseFloat(despesa.valor);
	}, 0);
	const totalConsumo = despesas.reduce((acc, despesa) => {
		return acc + parseFloat(despesa.consumo);
	}, 0);

	document.querySelector("#tabela-corpo-totais").innerHTML = `
		<tr>
		<td>Total</td>
		<td>${totalConsumo} m³</td>
		<td>R$ ${totalValor}</td>
		<td>R$ ${(totalValor / totalConsumo).toFixed(2)}/m³</td>
		</tr>
		<tr>
		<td>Média</td>
		<td>${(totalConsumo / despesas.length).toFixed(2)} m³</td>
		<td>R$ ${(totalValor / despesas.length).toFixed(2)}</td>
		<td>R$ ${(totalValor / totalConsumo).toFixed(2)}/m³</td>
		</tr>
	`;
}

function deletar(id) {
	despesas = despesas.filter((despesa) => despesa.id != id);
	atualizar();
}

function editar(id) {
	const despesa = despesas.find((despesa) => {
		return despesa.id == id;
	});
	document.querySelector("#data-cadastro").value = despesa.data;
	document.querySelector("#tipo-cadastro").value = despesa.tipo;
	document.querySelector("#valor-cadastro").value = despesa.valor;
	document.querySelector("#descricao-cadastro").value = despesa.descricao;
	deletar(id);
}
const filters = {
	descricao: "",
	tipo: "",
	valor: "",
	data: "",
	consumo: "",
};

document.querySelector("#descricao-filtro").addEventListener("keyup", () => {
	filters.descricao = document.querySelector("#descricao-filtro").value;
	const filtro = applyFilters();
	filtrar(filtro);
	criaTotal(filtro);
	criarGraficos(filtro);
});

document.querySelector("#tipo-filtro").addEventListener("change", () => {
	filters.tipo = document.querySelector("#tipo-filtro").value;
	const filtro = applyFilters();
	filtrar(filtro);
	criaTotal(filtro);
	criarGraficos(filtro);
});

document.querySelector("#valor-filtro").addEventListener("click", (e) => {
	e.preventDefault();
	filters.data = "";
	filters.consumo = "";
	filters.valor = ascValor ? "asc" : "desc";
	ascValor = !ascValor;
	const filtro = applyFilters();
	filtrar(filtro);
	criarGraficos(filtro);
});

document.querySelector("#consumo-filtro").addEventListener("click", (e) => {
	e.preventDefault();
	filters.data = "";
	filters.valor = "";
	filters.consumo = ascConsumo ? "asc" : "desc";
	ascConsumo = !ascConsumo;
	const filtro = applyFilters();
	filtrar(filtro);
});

document.querySelector("#data-filtro").addEventListener("click", (e) => {
	e.preventDefault();
	filters.valor = "";
	filters.consumo = "";
	filters.data = ascData ? "asc" : "desc";
	ascData = !ascData;
	const filtro = applyFilters();
	filtrar(filtro);
});

function applyFilters() {
	let filtro = despesas.slice();
	if (filters.descricao) {
		filtro = filtro.filter((despesa) => {
			return despesa.descricao
				.toLowerCase()
				.includes(filters.descricao.toLowerCase());
		});
	}
	if (filters.tipo && filters.tipo !== "todos") {
		filtro = filtro.filter((despesa) => {
			return despesa.tipo.toLowerCase().includes(filters.tipo.toLowerCase());
		});
	}
	if (filters.valor) {
		filtro = filtro.sort((a, b) => {
			const valueA = parseFloat(a.valor);
			const valueB = parseFloat(b.valor);
			return filters.valor === "asc" ? valueA - valueB : valueB - valueA;
		});
	}
	if (filters.data) {
		filtro = filtro.sort((a, b) => {
			const dateA = new Date(a.data);
			const dateB = new Date(b.data);
			return filters.data === "asc" ? dateA - dateB : dateB - dateA;
		});
	}
	return filtro;
}

function filtrar(filtro) {
	document.querySelector("#tabela-corpo").innerHTML = "";
	filtro.forEach((despesa) => {
		document.querySelector("#tabela-corpo").innerHTML += criaDespesa(despesa);
	});
}

function criarGraficos(despesas) {
	const consumo = document.querySelector("#grafico-consumo");
	const valor = document.querySelector("#grafico-valor");
	if (consumo.chart || valor.chart) {
		consumo.chart.destroy();
		valor.chart.destroy();
	}

	despesas = despesas.sort((a, b) => {
		const dateA = new Date(a.data);
		const dateB = new Date(b.data);
		return dateA - dateB;
	});

	const lables = despesas.map((despesa) => despesa.data);
	const consumoData = despesas.map((despesa) => despesa.consumo);
	const valorData = despesas.map((despesa) => despesa.valor);

	const consumoChart = new Chart(consumo, {
		type: "line",
		data: {
			labels: lables,
			datasets: [
				{
					label: "Consumo",
					data: consumoData,
					backgroundColor: "rgba(255, 99, 132, 0.2)",
					borderColor: "rgba(255, 99, 132, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
				},
			},
			plugins: {
				title: {
					display: true,
					text: "Consumo",
				},
			},
		},
	});

	consumo.chart = consumoChart;

	const valorChart = new Chart(valor, {
		type: "line",
		data: {
			labels: lables,
			datasets: [
				{
					label: "Valor",
					data: valorData,
					backgroundColor: "rgba(54, 162, 235, 0.2)",
					borderColor: "rgba(54, 162, 235, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
				},
			},
			plugins: {
				title: {
					display: true,
					text: "Valor",
				},
			},
		},
	});
	valor.chart = valorChart;
}
