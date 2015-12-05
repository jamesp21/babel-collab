//var data;
var root;
var jsonResult;
var baseUrl = 'http://babel-us-east-1.eigenfactor.org/search?q=';
var myApp = angular.module('myApp', []);

myApp.controller('myCtrl', function($scope, $http) {
    //console.log('test: ' + baseUrl + $scope.usrSearch)

    $scope.getSearch = function() {
        console.log('Step 1: getSearch');
        $http.get(baseUrl + $scope.usrSearch).success(function(response){
            root = $scope.bubbles = response.results
            buildHierarchy(root)
        })
    };

    //Transforming search output into a workable nested tree structure
    var buildHierarchy = function(data){    
        // Initializing tree with root 
        jsonData = {
            "name": 'root', "children": [{
            }] 
        }
     
        var labelsArray = [];
        //var publishersArray = [];    //We'll work on this later
  
        
        for (var i = 0; i < data.length; i++) {

            //if the data[i]label is 'undefined conundrum', there will be a group of articles with no labels

            //console.log("Debug #:" + i);
            //check if labelsArray already contains the label
            var contains = false;
            var index = 0;
            for (j = 0; j < labelsArray.length; j++) {
                if (data[i].label == labelsArray[j].name) {
                    contains = true;
                    index = j;
                }
            }
            //console.log('contains: ' + contains);


            //if the label is already contained in labelsArray, then...
            if (contains) {
                var articles = labelsArray[index].array;
                articles.push(data[i].title);
                //console.log('labelsArray[index].articlesArray: ' + labelsArray[index].articlesArray);
            } else {  //label is not contained in labelsArray
                var articlesArray = [];
                articlesArray.push(data[i].title);
                var object = {name: data[i].label, array: articlesArray};
                labelsArray.push(object);
            }
        }
        console.log('RESULTS');
        console.log(labelsArray);
        var jsonResult = JSON.stringify(labelsArray);
        console.log('FINAL: ' + jsonResult);
        $scope.root = jsonResult;
        //console.log('FINAL: ' + jsonData);
    }

    /*var file = "json/flare.json"
    $http.get(file).success(function(response) {
    root = $scope.bubbles = response
    console.log(response.children)
    })*/
})

.directive("bubbleChart", function($window) {
    console.log('TESTING1');

    // Return your directive
    return {
        restrict:'E', // restrict to an element
        // Add data to your directive scope (passed in via your html tag)
        scope:{
            root:'=',
        },

        // Link that allows you to manipulate the DOM
        link: function(scope, elem, attrs){
            console.log('Reached link');

            //Wrapper element to put your svg chart in
            wrapper = d3.select(elem[0]);

            scope.$watch('root', function(){
                if (scope.root == undefined) return
                console.log('TESTING3');    
                draw()
            })


            var margin = 20,
                 diameter = 500;

            var color = d3.scale.linear()
                .domain([-1, 5])
                .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
                .interpolate(d3.interpolateHcl);

            var pack = d3.layout.pack()
                .padding(2)
                .size([diameter - margin, diameter - margin])
                .value(function(d) { return d.depth; })

            var svg = wrapper.append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .append("g")
                    .attr("transform", "translate(" + diameter / 2  + "," + diameter /2 + ")");
         
            var draw = function() {     
                console.log('Step 2: drawBubbles');
                // Make a copy of your data, stored in an object {children:FILTERED-DATA}
                scope.filteredData = angular.copy(scope.root)//filtered)}
                console.log('this is scope.filteredData: ' + scope.filteredData)
                var focus = scope.root,
                        nodes = pack.nodes(scope.filteredData),
                        view;
                console.log(nodes);
                var circle = svg.selectAll("circle")
                        .data(nodes)
                    .enter().append("circle")
                        .attr("class", function(d) { return d ? d.children ? "node" : "node node--leaf" : "node node--scope.root"; })
                        .style("fill", function(d) {
                        for (var i = 0; i < d.length; i++) {
                         return d[0] ? color(d.depth) : null; 
                        }
                         })//return d.children ? color(d.depth) : null; })
                        .attr("cy", function(d) {return d[0].score * 30})
                        .attr("r", function(d) {return d[0].score * 15})
                        .attr("cx", function(d) {return d[0].score * 30})
                        
                        .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

                var text = svg.selectAll("text")
                        .data(nodes)
                    .enter().append("text")
                        .attr("class", "label")
                        .style("fill-opacity", function(d) { return d === scope.filteredData ? 1 : 0; })
                        .style("display", function(d) { return d === scope.filteredData ? "inline" : "none"; })
                        .text(function(d) { 
                          for (var i = 0; i < d.length; i++) {
                          return d[i].title
                          }
                           })
                        .attr("y", function(d) {return d[0].score * 30})
                        .attr("x", function(d) {return d[0].score * 30});

                var node = svg.selectAll("circle,text");

                wrapper
                        .style("background", color(-1))
                        .on("click", function() { zoom(scope.filteredData); });

                 zoomTo([scope.filteredData.x, scope.filteredData.y, scope.filteredData.r * 2 + margin]);

                function zoom(d) {
                console.log(d)
                    var focus0 = focus; focus = d;

                    var transition = d3.transition()
                            .duration(d3.event.altKey ? 7500 : 750)
                            .tween("zoom", function(d) {
                                console.log(view,focus)
                                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                                return function(t) { zoomTo(i(t)); };
                            });

                    transition.selectAll("text")
                        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                            .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
                            .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                            .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
                }

                function zoomTo(v) {
                    console.log('zoomto',v)
                    var k = diameter / v[2]; view = v;
                    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
                    circle.attr("r", function(d) { return d[0].score * k; });
                }

                d3.select(self.frameElement).style("height", diameter + "px");
            }
        }
    };
});