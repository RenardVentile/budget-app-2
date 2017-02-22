

// BUDGET CONTROLLER
var budgetController = (function() {
    
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };
    
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };
    
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum = sum + cur.value;
        });
        data.totals[type] = sum;
    };
    
    // Data Structure
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1 // Set to -1 becasue that means non-existant
    };
    // Makes these functions in this object public
    return {
        addItem: function(type, des, val) {   // Uses different names in argument to avoid confusion
            var newItem, ID;
            // Create new ID = last ID + 1
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            // Create new item based on "inc" or "exp" type
            if (type == "exp") {
                newItem = new Expense(ID, des, val);
            } else if (type === "inc") {
                newItem = new Income(ID, des, val);
            }
            // Push it into our data structure
            data.allItems[type].push(newItem);
            return newItem; // Return the new element
        },
        
        deleteItem: function(type, id) {
            var ids, index;
            
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });
            
            index = ids.indexOf(id);
            
            if (index !== -1) {
                // Splice removes the index from the array. takes 2 argumanets (starting positon, number of indexes to remove)
                data.allItems[type].splice(index, 1);
            }
            
        },
        
        calculateBudget: function() {
            // Calculate total income and total expenses
            calculateTotal("exp");
            calculateTotal("inc");
            // Calulate the budget (income - expenses)
            data.budget = data.totals.inc - data.totals.exp;
            // Calculate the % of income spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },
        
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
            
        },
        
        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return allPerc;
        },
        
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        
        // Use for making data public during development. Comment out before production
        testing: function() {
            console.log(data);
        }
        
    };
    
    
})();

// UI CONTROLLER
var UIController = (function() {
    // Saves the classes/ids selectors so that they can be reusable
    var DOMStrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expensesContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expensesLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container",
        expensesPercentageLabel: ".item__percentage",
        dateLabel: ".budget__title--month"
    };
    
    
    var formatNumber = function(num, type) {
        var numSplit, int, dec;
        
        num = Math.abs(num); // Doees not need a var because it stores it as an argument
        num = num.toFixed(2); // Adds 2 decimal places and rounds
        // Split the interger and decimal into an array
        numSplit = num.split(".");
        
        int = numSplit[0];
        // Add the comma every 3 
        if (int.length > 3) {
            // Substring method. To arguments (index where we want to start, how many characters we want)
            int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3); // input 2310, output 2,310.00
        }
        dec = numSplit[1];
        
        // Returns the +/- sign and the interger(with comma if applicable) plus decimal
        return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
        
    };
    
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };
    
    // Makes these functions in this object public
    return {
        getInput: function() {
            
            return {
                type: document.querySelector(DOMStrings.inputType).value, // Will either be .inc or .exp
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            };
            
            
        },
        
        addListItem: function(obj, type) {
            var html, newHtml, element;
            // Create HTML string with placeholder text
            if (type == "inc") {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
            } else if (type == "exp") {
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
            }
            
            // Replace the placeholder text with some actual data
            newHtml = html.replace("%id%", obj.id); // Creates a new html id 
            newHtml = newHtml.replace("%description%", obj.description); // replaces on newHTML instead of the intial html 
            newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));
            // Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
        },
        
        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            
            el.parentNode.removeChild(el);
            
        },
        
        clearFields: function() {
            var fields, fieldsArr;
            
            fields = document.querySelectorAll(DOMStrings.inputDescription + ", " + DOMStrings.inputValue);
            
            fieldsArr = Array.prototype.slice.call(fields);
            
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            
            fieldsArr[0].focus();
        },
        
        displayBudget: function(obj) {
            // Check whether the budget is positive or negative
            var type;
            obj.budget > 0 ? type = "inc" : "exp";
            
            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
            document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, "exp");
            
            if (obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = "---";
            }
            
        },
        
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);
            
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                } else {
                    current.textContent = "---";
                }
            });
        },
        
        displayMonth: function() {
            var now, months, month, year;
            
            now = new Date();
            
            months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            month = now.getMonth();
            
            year = now.getFullYear();
            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + " " + year;
        },
        
        changedType: function() {
            var fields = document.querySelectorAll(
                DOMStrings.inputType + "," +
                DOMStrings.inputDescription + "," +
                DOMStrings.inputValue
            );
            
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle("red-focus");
            });
            
            document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
        },
        
        getDOMStrings: function() {
            return DOMStrings;
        }
    };
    
})();


// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl) {  // Passes the other controllers in as arguments (name changed to show the difference)
    // Stores Event Listeners to be reusable
    var  setupEventListeners = function() {
        
        var DOM = UICtrl.getDOMStrings();
        
        document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);
        
        document.addEventListener("keypress", function(event) {
            
            if  (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        
        document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);
        
        document.querySelector(DOM.inputType).addEventListener("change", UICtrl.changedType);
    };
    
    
    var updateBudget = function() {
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();
        // 2. Return the budget
        var budget = budgetCtrl.getBudget();
        // 3. Display the budget in the UI
        UICtrl.displayBudget(budget);
    };
    
    var updatePercentages = function() {
        // Calculate the percentages
        budgetCtrl.calculatePercentages();
        // Read percentages from the budget conteoller
        var percentages = budgetCtrl.getPercentages();
        // Update the UI with new percentages
        UICtrl.displayPercentages(percentages);
    };
    
    
    var ctrlAddItem = function() {
        var input, newItem;
        
        // 1. Get the field input data
        input = UICtrl.getInput();
        
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budge controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);
            // 4. Clear the fields
            UICtrl.clearFields();
            // 5. Calculate and updateBudget
            updateBudget();
            // 6. Calculate and update percentages
            updatePercentages();
        }
    };
    
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        // DOM traversion for event delegation to select the whole item to delete
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if (itemID) {
            
            splitID = itemID.split("-");
            type = splitID[0];
            ID = parseInt(splitID[1]);
            
            // Delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);
            // Delete the item from the UI
            UICtrl.deleteListItem(itemID);
            // Update and show the budget
            updateBudget();
            // Calculate and update percentages
            updatePercentages();
        }
        
    };
    
    
    // Makes these functions in this object public
    return {
        init: function() {
            console.log("App has started");
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };
    
})(budgetController, UIController);


controller.init();

