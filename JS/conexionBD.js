const mysql=require("mysql")
const express=require("express")
const path=require("path")
const app=express()
const cors=require("cors")
app.use(cors())
app.use(express.urlencoded({ extended: true }))

let conexion=mysql.createConnection({
    host:"localhost",
    database:"tareas",
    user:"root",
    password:"",
})