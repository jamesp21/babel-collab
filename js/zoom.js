var data;
var root;
var baseUrl = 'http://babel-us-east-1.eigenfactor.org/search?q='
var myApp = angular.module('myApp', [])
console.log('outside controller')

var myCtrl = myApp.controller('myCtrl', function($scope, $http) {
    $scope.getSearch = function() {
    $http.get(baseUrl + $scope.usrSearch).success(function(response){
        data = $scope.usrSearch = response.results
        console.log(response)
    })
    };
    var file = "json/flare.json"
    $http.get(file).success(function(response) {
    root = $scope.bubbles = response
    console.log(response.children)
    })

    // Transforming search output into a workable nested tree structure

    // Initializing tree with root 
    jsonData = {
        "name": 'root', "children": [{

        }] 
    }
    // Looping through the array
    
    var labels = []

    for (var result = 0; result <= data.length; result++) {
        for(var i = 0; i <= labels.length; i++) {
            if (data[result][label] == labels[i]) {

            } else {
                
            }
        }
        


            var articles = []
            result[publisher]
            // create array article
            // create all the publishers 
            // create all the labels
            // push all the articles into the publishers
            // push all the publishers into label
            // push all labels into root?

            if (data[result][label][publisher].hasOwnProperty(result.publisher)) {
                // publisher exists, put result in there              
            } else {
                // publisher doesn't exit make a publisher object
            }
            break;
        }
    }
    //

})

var myDir = myApp.directive("bubbleChart", function($window) {
    // Return your directive
    return {
    restrict:'E', // restrict to an element
    // Add data to your directive scope (passed in via your html tag)
    scope:{
        root:'=',
    }, 
    link: function(scope, elem, attrs){

        //Wrapper element to put your svg chart in
        wrapper = d3.select(elem[0]);

        scope.$watch('root', function(){
        if (scope.root == undefined) return
        console.log(scope.root)
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
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");











        var draw = function() {     
 
            // Make a copy of your data, stored in an object {children:FILTERED-DATA}
            scope.filteredData = angular.copy(scope.root)//filtered)}
            var focus = scope.root,
                    nodes = pack.nodes(scope.filteredData),
                    view;
            console.log(nodes);
            var circle = svg.selectAll("circle")
                    .data(nodes)
                .enter().append("circle")
                    .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--scope.root"; })
                    .style("fill", function(d) { return d.children ? color(d.depth) : null; })
                    .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

            var text = svg.selectAll("text")
                    .data(nodes)
                .enter().append("text")
                    .attr("class", "label")
                    .style("fill-opacity", function(d) { return d.parent === scope.filteredData ? 1 : 0; })
                    .style("display", function(d) { return d.parent === scope.filteredData ? "inline" : "none"; })
                    .text(function(d) { return d.name; });

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
                circle.attr("r", function(d) { return d.r * k; });
            }

            d3.select(self.frameElement).style("height", diameter + "px");
        }
    }
    };
});