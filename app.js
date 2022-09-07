const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");



const itemsSchema = mongoose.Schema({
    name : String
});


const Item = mongoose.model("Item", itemsSchema);  

const item1 = new Item({
    name : "Welcome to ToDoList!"
});

const item2 = new Item({
    name : "Hit the + button to add new item"
});

const defaultItems = [item1, item2];

const listSchema = mongoose.Schema({
    listType : String,
    items : [itemsSchema]
});

const List = mongoose.model("list", listSchema);

let newItems = [];
let workItems = [];

app.get("/", (req, res)=>{

    
    Item.find({}, (err, foundItems)=>{
        
        if(err)
        {
            console.log("Error occured!!!");
        }
        else
        {
            if(foundItems.length == 0)
            {
                Item.insertMany(defaultItems, (err)=>{
                    if(err)
                    {
                        console.log("Error occured!!!");
                        console.log(err);
                    }
                    else
                    {
                        console.log("Default Item got added");
                    }
                });

                res.redirect("/");
            }
            else
            {
                res.render("list", { listTitle : "Today", newItems : foundItems});
            }
        }
    });
    
});


app.post("/", (req, res)=>{
    const newItem = req.body["newItem"]; 
    const listName = req.body.list;
    
    const newInput = new Item({
        name : newItem
    });

    if(listName === "Today")
    {
        newInput.save();
        res.redirect("/");
    }
    else
    {
        
        List.findOne({listType : listName}, (err, foundList)=>{
            foundList.items.push(newInput);
            foundList.save();
            console.log("/" + listName);
            res.redirect("/" + listName);
        });
    }
});


app.post("/delete", (req, res)=>{
    const checkBoxId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today")
    {
        Item.findByIdAndRemove(checkBoxId, (err)=>{

            if(err)
            {
                console.log("Error !!!");
                console.log(err);
            }
            else
            {
                console.log("Successfully deleted Checked Item");
                res.redirect("/");
            }
        });
    }
    else
    {
        List.findOneAndUpdate({listType : listName}, {$pull : {items : {_id : checkBoxId} } }, (err, foundList)=>{
            if(err)
            {
                console.log("Error deleting in custom list");
            }
            else
            {
                res.redirect("/" + listName);
            }
        });
    }
    
});


app.get("/:customListName", (req, res)=>{
    

    const customListN = _.capitalize(req.params.customListName);

    List.findOne({listType : customListN}, (err, foundList)=>{
        if(!err)
        {
            if(!foundList)
            {
                const list = new List({
                    listType : customListN,
                    items : defaultItems
                });
                list.save();
                res.redirect("/" + customListN);
            }
            else
            {
                res.render("list", { listTitle : foundList.listType , newItems : foundList.items});
            }
        }
    });
});



app.get("/work", (req, res)=>{
    res.render("list", {"listTitle" : "Work Items", "newItems" : workItems});
});


app.get("/about", (req, res)=>{
    res.render("about");
});

app.listen(3000, ()=>{
    console.log("Server is listening at port 3000");
});



