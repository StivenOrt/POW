const mysql=require("mysql2")
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
    password:"root",
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
    const sql = 'UPDATE tareas SET completada = "Si" WHERE id_tarea = ?'; 
    
    conexion.query(sql, [id], function(err, result){
        if(err){
            console.error('Error al completar tarea:', err);
            return res.status(500).send('Error al marcar la tarea como completada.');
        }
        
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

app.post('/creartarea', function(req, res){
    const { titulo, descripcion, fecha_entrega, id_curso } = req.body;
    const sql = 'INSERT INTO tareas (titulo, descripcion, fecha_entrega, id_curso, completada) VALUES (?, ?, ?, ?, ? )';
    conexion.query(sql, [titulo, descripcion, fecha_entrega || null, id_curso || null, 'No'], function(err, result){
        if(err){
            console.error('Error al crear tarea:', err);
            return res.redirect('/creartarea');
        }
        res.redirect('/');
    });
});

app.post('/tareas/:id/eliminar', function(req, res){
    const id = req.params.id; 
    const sqlCheck = 'SELECT completada FROM tareas WHERE id_tarea = ?';
    const sql = 'DELETE FROM tareas WHERE id_tarea = ?'; 
    
    conexion.query(sqlCheck, [id], function(errCheck, resultsCheck){
        if(errCheck){
            console.error('Error comprobando estado de la tarea antes de eliminar:', errCheck);
            return res.status(500).send('Error al intentar eliminar la tarea.');
        }

        if(resultsCheck.length > 0 && String(resultsCheck[0].completada).toLowerCase() === 'si'){
            console.log(`Se intentó eliminar la tarea ID ${id} pero está marcada como completada. Operación cancelada.`);
            return res.redirect('/');
        }

        conexion.query(sql, [id], function(err, result){
        if(err){
            console.error('Error al eliminar tarea:', err);
            throw err;
        }
        
            if (result.affectedRows === 0) {
            console.log(`Intento de eliminar tarea ID ${id}, pero no se encontró.`);
        } else {
            console.log(`Tarea ID ${id} eliminada exitosamente.`);
        }
    
        res.redirect('/');
        });
    });
});

app.get('/editar/:id', function(req, res){
    const id = req.params.id;
    const sqlTarea = 'SELECT * FROM tareas WHERE id_tarea = ?';
    
    conexion.query(sqlTarea, [id], function(errTarea, resultTarea){
        if(errTarea){
            console.error('Error al buscar tarea para editar:', errTarea);
           
            return res.status(500).send('Error al cargar la tarea.');
        }
        
        if(resultTarea.length === 0) {
            return res.redirect('/');
        }
        
        const tareaToEdit = resultTarea[0]; 

        if(tareaToEdit && String(tareaToEdit.completada).toLowerCase() === 'si'){
            console.log(`Intento de abrir editor para tarea ID ${id} que ya está completada. Redirigiendo.`);
            return res.redirect('/');
        }

        const sqlCursos = 'SELECT * FROM cursos';

        conexion.query(sqlCursos, function(errCursos, resultCursos){
            if(errCursos){
                console.error('Error al listar cursos para edición:', errCursos);
                return res.status(500).send('Error al cargar los cursos.');
            }
            res.render('editartarea', { 
                courses: resultCursos, 
                tareaToEdit: tareaToEdit 
            });
        });
    });
});

app.post('/editar/:id', function(req, res){
    const id = req.params.id;
    const { titulo, descripcion, fecha_entrega, id_curso } = req.body;
    const sqlCheck = 'SELECT completada FROM tareas WHERE id_tarea = ?';

    const sql = `
        UPDATE tareas 
        SET titulo = ?, descripcion = ?, fecha_entrega = ?, id_curso = ?
        WHERE id_tarea = ?
    `;
    const data = [titulo, descripcion, fecha_entrega, id_curso, id];
    
    conexion.query(sqlCheck, [id], function(errCheck, resultsCheck){
        if(errCheck){
            console.error('Error comprobando estado de la tarea antes de editar:', errCheck);
            return res.status(500).send('Error al intentar editar la tarea.');
        }

        if(resultsCheck.length > 0 && String(resultsCheck[0].completada).toLowerCase() === 'si'){
            console.log(`Intento de editar tarea ID ${id} que ya está completada. Operación cancelada.`);
            return res.redirect('/');
        }

        conexion.query(sql, data, function(err, result){
        if(err){
            console.error('Error al actualizar tarea:', err);
            return res.status(500).send('Error al actualizar la tarea.');
        }
        
        res.redirect('/');
        });
    });
});

app.listen(3000,()=>{
    console.log("servidor activo en http://localhost:3000")
})

