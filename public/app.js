
const menuBtn = document.getElementById("menuBtn")
const menu = document.getElementById("menu")

menuBtn.onclick = ()=>{
menu.classList.toggle("show")
}

function show(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"))
document.getElementById(id).classList.add("active")
menu.classList.remove("show")
}

let produtos = []

function salvar(){
let codigo = document.getElementById("codigo").value
let nome = document.getElementById("nome").value

if(!codigo) return

produtos.push({codigo,nome})
document.getElementById("pcount").innerText = produtos.length
buscar()
}

function buscar(){
let q = document.getElementById("busca").value.toLowerCase()
let lista = document.getElementById("lista")
lista.innerHTML=""

produtos
.filter(p=>p.codigo.toLowerCase().includes(q))
.forEach(p=>{
let li=document.createElement("li")
li.textContent=p.codigo+" - "+p.nome
lista.appendChild(li)
})
}
