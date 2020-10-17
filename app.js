var budgetController = (function(){
    
     var Expense = function(id, description, value)
     {
         this.id = id;
         this.description = description;
         this.value = value;
         this.percentage = -1;
     };

     Expense.prototype.calcPercentage = function(totalIncome){
        if(totalIncome > 0)
        {
           this.percentage = Math.round((this.value / totalIncome) *100);
        } else{
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() { 
        return this.percentage;
    };

     var Income = function(id, description, value)
     {
         this.id = id;
         this.description = description;
         this.value = value;
     };

     var data = {
         allItems: {
             exp: [],
             inc: []
         },
         totals: {
             exp: 0,
             inc : 0
         },
         budget :0,
         percentage: -1 // non existant at the begining
     };

     var calculateTotal = function(type)
     {
         var sum = 0;
         data.allItems[type].forEach(function(cur){
             sum += cur.value;
         });
         data.totals[type] = sum;
     }
     // public API
     return {
         addItem: function(type, desc, val) {
             var newItem, ID;

             // create new ID
             if(data.allItems[type].length > 0)
             {
                ID = data.allItems[type][data.allItems[type].length -1].id +1;
             }
             else
             {
                ID = 0;
             }
             

             // Create new item based on the type
             if(type === 'exp')
             {
                newItem = new Expense(ID, desc, val);
             } else if(type === 'inc')
             {
                newItem = new Income(ID, desc, val);
             }

             // push it to our data structure
             data.allItems[type].push(newItem);

             //usefull to return the new item
             return newItem; 
         },

         deleteItem: function(type, id){
             var ids, index;
            ids = data.allItems[type].map(function(current){
                 return current.id; // Each node in allItems has: id, description, value
             });

             index = ids.indexOf(id); // the index of the element we want to delete
             if(index !== -1)
             {
                 data.allItems[type].splice(index, 1);
             }
         },

         calculateBudget: function(){
             // calculate total income and expense
             calculateTotal('exp');
             calculateTotal('inc');

             // Calculate income - expense
             data.budget = data.totals.inc - data.totals.exp;

             // calculate the percentage of income we spent, round the result
             if(data.totals.inc > 0)
             {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100); 
             }
             else{
                data.percentage = -1;
             }
             
         },

         calculatePercentages: function(){
             data.allItems.exp.forEach(function(cur){
                cur.calcPercentage(data.totals.inc);
             });
         },

         getPercentages: function() {
             var allPerc = data.allItems.exp.map(function(cur) {
                 return cur.getPercentage();                 
             });
             return allPerc;
         },

         getBudget: function()
         {
             // put all the data we want to return in a object
             return{
                 budget: data.budget,
                 totalInc: data.totals.inc,
                 totalExp: data.totals.exp,
                 percentage: data.percentage
             };
         },

         testingFunction: function(){
             console.log(data);
         }   
     };

})();

var UIController = (function()
{
    // using the power of closure
    var DOMStrings = 
    {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type){
        var numSplit, int, dec;
            /* 
            + or -  before the number
            exactly 2 decimal points
            comma seperating the thousands
            2310.4567 - > + 2,310.46
            2000 - >  2,000
             */
            // Calculate the absolute part first
        num = Math.abs(num);
        num = num.toFixed(2);

            // integet part and decimal part saved into array
        numSplit = num.split('.');
        int = numSplit[0];

        if(int.length > 3)
        int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length);
        dec = numSplit[1];
        type === 'exp'? sign = '-' : sign = '+';

        return (type === 'exp'? '-' : '+') + ' ' + int + '.' + dec;
        };

    return {
        // UIController public APIs 

        getInput: function() {
            return {
                type: document.querySelector(DOMStrings.inputType).value, // will either be int or exp
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            // Create html string with place holder text

            if(type === 'inc'){
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if(type === 'exp'){
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
    
            // Replace the placeholder text with actual data from the object
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            newHtml = newHtml.replace('%description%', obj.description);

            // insert the html into the dom
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorId)
        {
            var el =  document.getElementById(selectorId);
            el.parentNode.removeChild(el); // can remove dom element only using the parent and accees to the child
        },

        clearFields: function()
        {
            var fields, fieldsArray;

            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
            fieldsArray = Array.prototype.slice.call(fields);

            fieldsArray.forEach(function(current) {
                current.value = ""; // clear the input dom element value
            });

            // set the focus on the first element of the array, the input description
            fieldsArray[0].focus();
        },

        displayBudget: function(obj)
        {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(obj.totalExp,'exp');
            if(obj.percentage > 0)
            {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }
        },

        displayPercentages: function(percentages){
            var fields;

            fields = document.querySelectorAll(DOMStrings.expensesPercLabel); // returns a node list
            
            // For reuse we declare a wrapper function
            var nodeListForEach = function(list, callback)
            {
                for(var i = 0; i < list.length; i++)
                {
                    callback(list[i],i);
                }
            };

            nodeListForEach(fields, function(current, index){
                if(percentages[index] > 0)
                {
                    current.textContent = percentages[index] + '%';
                } else{
                    current.textContent = '';
                }
            });

        },

        displayMonth: function(){
            var now, year, month, months;
            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();
            months = ['January', 'February', 'March', 'April', 'May','June', ' July', 'August','September', 'October', 'November','December'];

            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        getDomStrings: function() {
            return DOMStrings;
        }
    };
})();


// this is the controlller which connects the Data and UI, they should know about each other
// in the controller we tell other modules what to do

var Controller = (function(budgetCtrl, UICtrl)
{
    var setUpEventListeners = function()
    {
        var DOM = UICtrl.getDomStrings();
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        // For any key pressing on the entire page
        // keypress event is a UI event
        document.addEventListener('keypress', function(event)
        {
            if(event.keyCode === 13 || event.which === 13) // tells us the key that was pressed from the event prototype
            {
                ctrlAddItem();
            }
        })

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
    };

    var updateBudget = function() {
        var budget;
         // Calculate the budget
         budgetCtrl.calculateBudget();

         // Return the budget
         budget = budgetCtrl.getBudget();

        // Display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function(){
        var pecetages;

        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. read from the budget ctrl
        pecetages = budgetCtrl.getPercentages();
        
        // 3. update the UI
        UICtrl.displayPercentages(pecetages);
    };

    var ctrlAddItem = function()
    {
        var input, newItem;

        // get the input from the UI field, ask UI module to bring it
        input = UICtrl.getInput();

        if(input.description !== "" && input.value > 0 )
        {
            // add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // add a new item to the UI
            UICtrl.addListItem(newItem,input.type);

            // clear input fields
            UICtrl.clearFields();

            // Calculate and update budget
            updateBudget();

            // Calculate and update the percentages
            updatePercentages();

        }
    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, id;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if(itemID) // we found
        {
            splitID = itemID.split('-');
            type = splitID[0];  // string
            id = parseInt(splitID[1]); // also string, but deleteItem expects int to we convert

            // 1. delete item from data structure
            budgetCtrl.deleteItem(type, id);

            // 2. delete the item from the UI
            UICtrl.deleteListItem(itemID);

            // 3. show the new budget
            updateBudget();

             // Calculate and update the percentages
             updatePercentages();
        }
    };

     // Controller public APIs 
    return{
        // init function to start running the code from outside the controller
        init: function() {
            console.log('Application has started');
            setUpEventListeners();
            UICtrl.displayBudget(
                {budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0});
            UICtrl.displayMonth();    
        }
    };

})(budgetController, UIController);

Controller.init();