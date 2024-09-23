var express = require('express');
var mssql = require('mssql');
var bodyParser = require('body-parser');

var app = express();
var port = 8080;

// параметры соединения с БД
var config = {
	user: 'new_user',
	password: 'secure_password',
	server: 'localhost',
	database: 'Library',
	options: {
		encrypt: true,
		trustServerCertificate: true
	}
};

// парсер для обработки данных форм
app.use(bodyParser.urlencoded({ extended: true }));

var connection = new mssql.ConnectionPool(config);


app.get('/add-faculty', function (req, res) {
	res.sendFile(__dirname + '/faculties.html');
});

app.get('/add-group', function (req, res) {
	res.sendFile(__dirname + '/groups.html');
});

app.get('/add-student', function (req, res) {
	res.sendFile(__dirname + '/students.html');
});


app.post('/add-faculty', function (req, res) {
	var facultyName = req.body.facultyName;

	connection.connect(function (err) {
		if (err) {
			console.log('Connection error:', err);
			res.status(500).send('Database connection failed');
			return;
		}
		var transaction = new mssql.Transaction(connection);
		transaction.begin(function (err) {
			var request = new mssql.Request(transaction);
			var query = `INSERT INTO Faculties (Name) VALUES (@facultyName);`;

			request.input('facultyName', mssql.VarChar, facultyName);

			request.query(query, function (err, data) {
				if (err) {
					console.log('Insert error:', err);
					transaction.rollback(function () {
						res.status(500).send('Transaction failed, rollback successful');
					});
				} else {
					transaction.commit(function () {
						res.send('Faculty added successfully');
					});
				}
			});
		});
	});
});

app.post('/add-group', function (req, res) {
	var facultyName = req.body.facultyName;
	var groupName = req.body.GroupName;

	connection.connect(function (err) {
		if (err) {
			console.log('Connection error:', err);
			res.status(500).send('Database connection failed');
			return;
		}
		var transaction = new mssql.Transaction(connection);
		transaction.begin(function (err) {
			var request = new mssql.Request(transaction);
			var getFacultyIdQuery = `SELECT Id FROM Faculties WHERE Name = @facultyName;`;

			request.input('facultyName', mssql.VarChar, facultyName);

			request.query(getFacultyIdQuery, function (err, result) {
				if (err) {
					console.log('Error fetching faculty ID:', err);
					transaction.rollback(function () {
						res.status(500).send('Transaction failed, rollback successful');
					});
				} else if (result.recordset.length === 0) {
					transaction.rollback(function () {
						res.status(404).send('Faculty not found');
					});
				} else {
					var facultyId = result.recordset[0].Id;
					var insertGroupQuery = `INSERT INTO Groups (Name, Id_Faculty) VALUES (@groupName, @facultyId);`;

					request.input('groupName', mssql.VarChar, groupName);
					request.input('facultyId', mssql.Int, facultyId);

					request.query(insertGroupQuery, function (err, data) {
						if (err) {
							console.log('Insert error:', err);
							transaction.rollback(function () {
								res.status(500).send('Transaction failed, rollback successful');
							});
						} else {
							transaction.commit(function () {
								res.send('Group added successfully');
							});
						}
					});
				}
			});
		});
	});
});

app.post('/add-student', function (req, res) {
	var studentFirstName = req.body.StudentFirstName;
	var studentLastName = req.body.StudentLastName;
	var groupName = req.body.GroupName;

	connection.connect(function (err) {
		if (err) {
			console.log('Connection error:', err);
			res.status(500).send('Database connection failed');
			return;
		}
		var transaction = new mssql.Transaction(connection);
		transaction.begin(function (err) {
			var request = new mssql.Request(transaction);
			var getGroupIdQuery = `SELECT Id FROM Groups WHERE Name = @groupName;`;

			request.input('groupName', mssql.VarChar, groupName);

			request.query(getGroupIdQuery, function (err, result) {
				if (err) {
					console.log('Error fetching group ID:', err);
					transaction.rollback(function () {
						res.status(500).send('Transaction failed, rollback successful');
					});
				} else if (result.recordset.length === 0) {
					transaction.rollback(function () {
						res.status(404).send('Group not found');
					});
				} else {
					var groupId = result.recordset[0].Id;
					var insertStudentQuery = `INSERT INTO Students (FirstName, LastName, Id_Group,Term) VALUES (@studentFirstName, @studentLastName, @groupId,2);`;

					request.input('studentFirstName', mssql.VarChar, studentFirstName);
					request.input('studentLastName', mssql.VarChar, studentLastName);
					request.input('groupId', mssql.Int, groupId);
					request.input('Term', mssql.Int, 2);

					request.query(insertStudentQuery, function (err, data) {
						if (err) {
							console.log('Insert error:', err);
							transaction.rollback(function () {
								res.status(500).send('Transaction failed, rollback successful');
							});
						} else {
							transaction.commit(function () {
								res.send('Student added successfully');
							});
						}
					});
				}
			});
		});
	});
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
