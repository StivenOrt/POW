const mysql=require("mysql")
const express=require("express")
const path=require("path")
const app=express()
const cors=require("cors")
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'Public', 'views'))


let conexion=mysql.createConnection({
    host:"localhost",
    database:"tareas",
    user:"root",
    password:"",
})

conexion.connect(function(error){
    if(error){
        throw error;
    } else {
        console.log("Conexión exitosa a la base de datos");
    }
});

app.get('/', function(req, res){
    let sql = "Select t.*, c.nombre_curso, d.nombre from tareas t inner join cursos c on t.id_curso = c.id_curso inner join docentes d on d.id_docente = c.id_docente";
    conexion.query(sql, function(err, results){
        if(err) throw err;
        res.render('index', { tasks : results });
    });
});

app.post('/tareas/:id/completar', function(req, res){
    const id = req.params.id;
    const sql = "UPDATE tareas SET completada = 'Si' WHERE id_tarea = ?";
    conexion.query(sql, [id], function(err, result){
        if(err) throw err;
        res.redirect('/');
    });
});

app.get('/creartarea', function(req, res){
    const sqlCursos = 'SELECT id_curso, nombre_curso FROM cursos';
    conexion.query(sqlCursos, function(err, cursos){
        if(err){
            console.error('Error al obtener cursos:', err);
            return res.render('creartarea', { courses: [] });
        }
        res.render('creartarea', { courses: cursos });
    });
});

// recibir creación de tarea desde el formulario
app.post('/creartarea', function(req, res){
    const { titulo, descripcion, fecha_entrega, id_curso } = req.body;
    const sql = 'INSERT INTO tareas (titulo, descripcion, fecha_entrega, id_curso, completada) VALUES (?, ?, ?, ?, ? )';
    conexion.query(sql, [titulo, descripcion, fecha_entrega || null, id_curso || null, 'No'], function(err, result){
        if(err){
            console.error('Error al crear tarea:', err);
            // redirigir de vuelta con un mensaje simple (puedes mejorar mostrando error en la vista)
            return res.redirect('/creartarea');
        }
        res.redirect('/');
    });
});

app.listen(3000,()=>{
    console.log("servidor activo en http://localhost:3000")
})