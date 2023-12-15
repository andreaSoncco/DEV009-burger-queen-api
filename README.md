# BURGER QUEEN API - 🍔🍟 API REST, Node js & MongoDB Atlas, Express 💚🗳

Puedes revisar la documentación completa de la API en Swagger. Encuentra detalles sobre cada endpoint y cómo interactuar con los servicios en el siguiente enlace: [Ir a Swagger](https://app.swaggerhub.com/apis-docs/ANDREASONCCOC/BurgerQueenAPI/1.0.1)

Puedes acceder a la API mediante el siguiente enlace: [Ir a la API](https://node-mongo-api-nine.vercel.app/)

## Índice

* [1. Preámbulo](#1-pre%C3%A1mbulo)
* [2. Resumen del Proyecto](#2-resumen-del-proyecto)
* [3. Proceso de Diseño y Desarrollo](#5-proceso-de-diseño-y-desarrollo)
* [5. Recursos del Proyecto](#6-herramientas-de-elaboración)

## 1. Preámbulo

Un pequeño restaurante de hamburguesas, que está creciendo, necesita un
sistema a través del cual se puedan tomar pedidos usando una _tablet_, y enviarlos
a la cocina para que se preparen ordenada y eficientemente.

Este servicio tiene dos áreas: interfaz web (cliente) y API (servidor), el presente
proyecto aborda el desarrollo de la API.

## 2. Resumen del Proyecto

El proyecto consiste en construir un servidor web, un programa al cual se puede
acceder en un puerto de red, que escucha consultas (request) y envia respuestas
(response) utilizando el protocolo HTTP y el formato JSON.

El stack utilizado para este programa es Node js y Express, complementado con un
motor de base de datos no relacional en MongoDB. Esta API Rest implica una arquitectura
de cliente/servidor conectada a MongoDB Atlas, haciendo uso de Operaciones CRUD para
administrar las colecciones de datos en **orders**, **products** y **users**.

En su desarrollo se utilizó **JWT** (_JSON Web Tokens_) **con una cookie** para autenticar
las cuentas de las usuarias y lograr la persistencia de datos de inicio de sesión y
finalmente el despligue del servidor web se hizo en **Vercel**.

## 3. Proceso de Diseño y Desarrollo

### 3.1. Planificación y Diseño. ✏️

Para realizar el proyecto me organice utizando Github Project. De esta manera planifique mejor el tiempo y dividi el trabajo en metas por sprint usando `milestones` que contienen `issues` o tareas más pequeñas.Aplique metodología SCRUM de trabajo ágil.

Una parte del diseño de la API además de establecer la arquitectura como servidor/cliente fue la definición de los esquemas de los modelos de datos, que consistio en
describir de alguna forma la estructura de las colecciones que se uso y la forma de los objetos que se guardaron en dichas colecciones, para esto produje un esquema en excel donde reproduje la estructura de la base de datos teniendo en cuenta las 3 colecciones, sus elementos y respectivas propiedades.

[Ir al Esquema](https://docs.google.com/spreadsheets/d/1xJTZ-URxEsTb0OmiZAnuGRv3paYv_zBpTgnSxhVerBw/edit?usp=sharing)

**Esquema Planeado para MongoDB**
![Hoja de Excel del Esquema](img/esquema.png)

### 3.2. Desarrollo de la API.

El desarrollo de la API tomo diez sprints y al cabo de cada uno tuve en cuenta el feedback recibido para hacer mejoras, a continuación pasaré a mostrar la imagen de mi tablero en Github Project donde guió el desarrollo en 3 hitos:

- Hito 1 📚: Crear el entorno de Desarrollo 🌱 y Cumplir con la Guía de Primeros Pasos con Docker y Los Primeros Pasos con Mongo DB. Además aprender conceptos Generales del Back End

- Hito 2 ⌨️: Planear y desarrollar los test, implementar las rutas de Productos

- Hito 3 ⭐️: Implementar los endpoints para Products y Orders, hacer cambios en la rama feat-add-endpoints

**Tablero de Github Project**

![Tablero de Github Project](img/Github.png)

**Cuadro de Milestones**

![Cuadro de Milestones](img/Milestones.png)

## 4. Recursos del Proyecto

### 4.1. Conceptos Tratados 💫

Stack **Node.js & Express**, **rutas** (_routes_), **URLs**, **HTTP** y **REST** (verbs, request, response, headers, body, status codes), **JSON**, **JWT** (_JSON Web Tokens_), **conexión con una base datos** (`MongoDB`), **variables de entorno** y **deployment**.

### 4.2. Herramientas de Elaboración 👩‍🔧💻

- JavaScript
- Node.js: como entorno de programación de JavaScript con Módulo `path`
- Express: como framework para crear el servidor y hacer uso de los métodos HTTP
- MongoDB : base de datos no relacional, con la que se aplicó las Operaciones CRUD
- MongoDB Atlas: para alojar la base de datos
- Vercel: como plataforma para el despligue del servidor web
- Terminal de Git Bash o PowerShell
- Pruebas de integración e2e: Pruebas de integración end-to-end (e2e): para probar el programa completo
- Github Project: para planificar el tiempo y dividir las tareas
- Esquema de Base de Datos en Microsoft Excel.