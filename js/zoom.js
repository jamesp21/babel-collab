var root;
var jsonResult;
var baseUrl = 'http://babel-us-east-1.eigenfactor.org/search?q=';
var myApp = angular.module('myApp', []);

myApp.controller('myCtrl', function($scope, $http) {
    //$scope.selected = ""

    $scope.getSearch = function() {
        $http.get(baseUrl + $scope.usrSearch).success(function(response){
            $http.get(baseUrl + $scope.usrSearch + "&start=10").success(function(responseNext){
                $http.get(baseUrl + $scope.usrSearch + "&start=20").success(function(responseLast){  
                    console.log("response.results: " + response.results)
                    console.log("responseNext.results: " + responseNext.results)
                    
                    var sum = response.results.concat(responseNext.results);
                    //console.log("sum1: " + sum.length);
                    sum = sum.concat(responseLast.results);
                    //console.log("sum2: " + sum.length);
                    console.log(sum);

                    //case where no results are found
                    if (sum == "") {
                        $scope.selected = "No results found"
                    } else {
                        $scope.selected = $scope.usrSearch
                        root = $scope.bubbles = buildHierarchy(sum) 
                        console.log(root)
                    }
                })
            })
        })
    };

    var buildHierarchy = function(json) {
        var structuredObject = {
            "name" : "root",
            "children" : []
        }

        for (var i = 0; i < json.length; i++) {
            console.log("Size: " + json.length);
            var book = json[i];
            //case where book doesn't have a label
            if (book.label == undefined) {
                book.label = "no label"
            }
            addLabel(book.label, book, structuredObject.children)
        }

        function addLabel(label, obj, objArray) {
            for (var i = 0; i < objArray.length; i++) {
                var labelObject = objArray[i];
                if (labelObject.title == label) {
                    addToChildren(obj.title, obj, labelObject.children)
                    return
                } 
            }

            var labelObject = {
                "title": label,
                "children" : []
            }
            addToChildren(obj.title, obj, labelObject.children)
            objArray.push(labelObject)
        }

        function addToChildren(publisherName, book, childrenArray) {
            for (var i = 0; i < childrenArray.length; i++) {
                var childPublisher = childrenArray[i];
                if (childPublisher.title == publisherName) {
                    childPublisher.children.push({"title" : book.title, "score" : book.score})
                    return
                }
            }
            var newPublisherObject = {
                "title": publisherName,
                "children" : [{"title" : book.title, "score" : book.score}]
            }
            childrenArray.push(newPublisherObject)
        }
        return structuredObject;
    }
})

var myDir = myApp.directive("bubbleChart", function($window) {
    // Return your directive
    return {
    restrict:'E', // restrict to an element
    // Add data to your directive scope (passed in via your html tag)
    scope:{
        root:'=',
        selected: '=',
    }, 
    transclude:true,
    link: function(scope, elem, attrs) {

        //Wrapper element to put your svg chart in
        wrapper = d3.select(elem[0]);

       // console.log(scope.root + "");

        scope.$watch('root', function(){
            if (scope.root == undefined) return
            //console.log(scope.root)
            draw()
        })

        var margin = 20,
            diameter = 960;

        var color = d3.scale.linear()
            .domain([-1, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])

            //experiment with rgb colors
            //.range(["hsl(52,80%,80%)", "hsl(128,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        //color.range(["hsl(52,80%,80%)", "hsl(128,30%,40%)"]);

        var pack = d3.layout.pack()
            .padding(2)
            .size([diameter - margin, diameter - margin])
            .value(function(d) { return d.score })//d.depth;})//(d.score * 1000)})

        var svg = wrapper.append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        // Circle positioning function
        /*var circleFunc = function(circle) {
            circle.attr('cx', function(d){return d.x})
                .attr('cy', function(d){return d.y})
                .attr('r', function(d){return d.r})
                .attr('fill', function(d) {
                })
        }*/

        var draw = function() {     
            // Make a copy of your data, stored in an object {children:FILTERED-DATA}
            scope.filteredData = angular.copy(scope.root)//filtered)}
            var focus = scope.root,
                nodes = pack.nodes(scope.filteredData),
                view;

            //solution to solve second search glitch
            svg.selectAll("circle").remove();

            var circle = svg.selectAll("circle")
                .data(nodes, function(d) {return d.title});
                //.data(nodes)
            circle.enter().append("circle")
                .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--scope.root"; })
                
                //attempt to change circle colors with if statements
                /*
                var booleanColor = function(d) {
                    return d.title.length < 8
                }
                if (booleanColor) {
                    color.range(["hsl(52,80%,80%)", "hsl(128,30%,40%)"])
                } else {
                    color.range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
                };
                */

                .style("fill", function(d) { return d.children ? color(d.depth) : null; })
                //.attr('r', function(d){return 1000})
                .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
                
                // Mouseover effect!!!
                .append("svg:title").text(function(d) { return d.title; })
                .on("mouseover", function() {
                    d3.select(this).select("circle").style("display", "block");
                })
                .on("mouseout", function () {
                    d3.select(this).select("circle").style("display", "none");
                });

            //attempt to change each circle color and size
            //color.range(["hsl(52,80%,80%)", "hsl(128,30%,40%)"])
            svg.selectAll("circle")
                .attr("r", 100)
                //.style("fill", "red");


            //solution to solve second search glitch
            svg.selectAll("text").remove();

            console.log("scope.filteredData" + scope.filteredData);
            var text = svg.selectAll("text")
                    .data(nodes);
            console.log(nodes)
            console.log("nodes.children: " + nodes.children);

                text.enter().append("text")
                    .attr("class", "label")
                    .attr("id", "textwrap")
                    .style("opacity", function(d) { return d.parent === scope.filteredData ? 0.5 : 1; })
                    .style("display", function(d) { return d.parent === scope.filteredData ? "block" : "none"; })
                    //.style("font-size", function(d) { return d.parent === scope.filteredData ? 25 : 15; })
                    .style("font-size", function(d) { return (d.children !== undefined && d.children.length > 1) ? 25 : 15; })          
                    .text(function(d) { return d.title});
            //d3plus.textwrap()
                //.container(d3.select("#textwrap"));
            

            var node = svg.selectAll("circle,text");

            wrapper
                .style("background", color(-10))
                .on("click", function(d) {  zoom(scope.filteredData); });

             zoomTo([scope.filteredData.x, scope.filteredData.y, scope.filteredData.r * 2 + margin]);

            function zoom(d) {
                // scope.selected = d.title; console.log(scope.selected);
                scope.$apply(function(){
                    scope.selected= d.title
                    //console.log(scope.selected)
                })
                //console.log(d)
                var focus0 = focus; focus = d;

                var transition = d3.transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .tween("zoom", function(d) {
                            //console.log(view,focus)
                            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                            return function(t) { zoomTo(i(t)); };
                        });

                transition.selectAll("text")
                    .filter(function(d) { return d.parent === focus || this.style.display === "block"; })
                        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
                        .each("start", function(d) { if (d.parent === focus) this.style.display = "block"; })
                        .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });                      
            }

            function zoomTo(v) {
                var k = diameter / v[2]; view = v;
                node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
                circle.attr("r", function(d) { return d.r * k; });
                circle.exit().remove()
            }
                d3.select(self.frameElement).style("height", diameter + "px");
            }
        }
    };
});