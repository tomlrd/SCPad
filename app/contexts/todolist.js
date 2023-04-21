const datas = {
    todos: []
}
datas.todos = localStorage.getItem('todoList') ? datas.todos =JSON.parse(localStorage.getItem('todoList')) : [] // initial state


const addTodo = (el) => {
    try {
        let lastid = datas.todos.length !== 0 ? parseInt(datas.todos.slice(-1)[0].id) + 1 : 0
        let newtodo = { id: lastid, title: el.title, content: el.content }
        datas.todos.push(newtodo)
        localStorage.setItem('todoList', JSON.stringify(datas.todos))
        return newtodo
    } catch (error) {
        console.log(error);
        return false
    }
}

const removeById = (el) => {
    let found = datas.todos.find(todo => {
        return todo.id === parseInt(el)
    });
    if (found) {
        datas.todos.splice(datas.todos.indexOf(found), 1);
        localStorage.setItem('todoList', JSON.stringify(datas.todos))
        return found
    } else {
        return false
    }
}

const returnDatas = async () => {
    return datas
}

const display =  (todo) => {
    let tododiv = `
    <div data-todoId="${todo.id}" class="todo" >
        <div>title: ${todo.title}</div>
        <div>content: ${todo.content}</div>
        <button class="rmTodo" onclick="removeTodo(${todo.id})">✖</button>
    </div>
    `
    return tododiv
}

module.exports = { returnDatas, addTodo, removeById, display }