//This is a utility function, apparently javascript doesn't have proper hash function.
const hashCode = function(str, seed = 0) { //hashing on 53 bits (collision risk virtually 0)
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1>>>0);
};

//utility class to manage function tables
class handleManager {
  constructor() {
    this.tableFunction = [];
    var self = this;

    this.insertHandler = function(theFunction) { //insert unique
      if (self.retrieveHandler(theFunction) == null) {
          self.tableFunction.push({'hash':hashCode(theFunction.toString()), 'function':theFunction});
          return 1;
      }
      else return 0;
    }
  
    this.executeAllHandlers = function() {
      self.tableFunction.forEach((item) => {item.function()})    
    }

    this.returnAllHandlers = function() {
      let tempTable = [];
      self.tableFunction.forEach((theHand) => {tempTable.push(theHand.function)});
      return tempTable;
    }

    this.retrieveHandler = function(theFunction) {
      let index = self.tableFunction.findIndex((fun)=> {return fun.hash == hashCode(theFunction.toString())});
      if (index<0) {return null} // this function is not part of our data structure.
      else return (self.tableFunction[index].function);
    }
  
    this.suppressHandler = function(theFunction) {
      let index = self.tableFunction.findIndex((fun)=> {return fun.hash == hashCode(theFunction.toString())});
      if (index<0) {return 0} // this function is not part of our data structure.
      else {
          self.tableFunction.splice(index, 1);
          return 1;
      } 
    }
  
    
    
  }
}  
exports.handleManager = handleManager;