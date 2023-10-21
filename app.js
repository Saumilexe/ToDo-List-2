//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config();
const mongoose = require("mongoose");
var _ = require('lodash');

const port = process.env.PORT || 3000;
const app = express();
const uri = `mongodb+srv://${process.env.N1_KEY}:${process.env.N1_SECRET}@cluster0.unin1dn.mongodb.net`;
console.log(uri);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

async function start() {
  try {
      await mongoose.connect(uri + '/todolistDB');
      console.log('Connected to MongoDB');
  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
  }
}
start();

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to To Do List"
});
const item2 = new Item ({
  name: "Hit + to add a new task"
});
const item3 = new Item ({
  name: "Thank you!"
});
const defaultItems = [item1, item2, item3];

const ListSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", ListSchema);

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems == 0) {
      Item.insertMany(defaultItems)
      .then(function() {
      console.log("Successfully saved default items into DB");
      res.redirect("/");
      })
      .catch(function(err) {
      console.log(err);
      });
    } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const customListCheck = await List.findOne({ name: customListName }).exec();
  if (!customListCheck) {
    const list = new List ({
      name: customListName,
      items: defaultItems
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {listTitle: customListName, newListItems: customListCheck.items});
  }
});

app.post("/", async function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({name: listName}).exec();
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const checkedListName = req.body.listName;
  
  if (checkedListName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
    .then(function() {
      console.log("Task Deleted");
      res.redirect("/");
    })
    .catch(function (error) {
      console.log(error);
    });
  } else {
    async function updateList () {
      try {
        const foundList = await List.findOne({name: checkedListName}).exec();
          if (foundList) {
            foundList.items.pull({_id: checkedItemId});
            foundList.save();
            res.redirect("/" + checkedListName)
          } else {
            console.log("List not found");
          };
      }
      catch (error) {
        console.log(error);
      }}
      updateList();
};
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
