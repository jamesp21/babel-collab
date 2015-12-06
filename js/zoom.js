var root;
var jsonResult;
var baseUrl = 'http://babel-us-east-1.eigenfactor.org/search?q=';
var myApp = angular.module('myApp', []);

myApp.controller('myCtrl', function($scope, $http) {
    //console.log('test: ' + baseUrl + $scope.usrSearch)

    $scope.getSearch = function() {
        $http.get(baseUrl + $scope.usrSearch).success(function(response){
            root = $scope.bubbles = buildHierarchy(response.results)
            
        })
    };

    var buildHierarchy = function(json) {
        var structuredObject = {
            "name" : "root",
            "children" : []
        }

        for (var i = 0; i < json.length; i++) {
            var book = json[i];
            addLabel(book.label, book, structuredObject.children)
        }

        function addLabel(label, obj, objArray) {
            for (var i = 0; i < objArray.length; i++) {
                var labelObject = objArray[i];
                if (labelObject.label == label) {
                    addToChildren(obj.publisher, obj, labelObject.children)
                    return
                }
            }
            var labelObject = {
                "label": label,
                "children" : []
            }
            addToChildren(obj.publisher, obj, labelObject.children)
            objArray.push(labelObject)
        }

        function addToChildren(publisherName, book, childrenArray) {
            for (var i = 0; i < childrenArray.length; i++) {
                var childPublisher = childrenArray[i];
                if (childPublisher.publisher == publisherName) {
                    childPublisher.children.push({"title" : book.title, "score" : book.score})
                    return
                }
            }
            var newPublisherObject = {
                "publisher": publisherName,
                "children" : [{"title" : book.title, "score" : book.score}]
            }
            childrenArray.push(newPublisherObject)
        }
        var jsonResults = JSON.stringify(structuredObject)
        $scope.root = jsonResults
        return jsonResults;
    }

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

       // console.log(scope.root + "");

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
     

        // Bubble function
        var circleFunc = function(circle) {
            circle.attr('cx', function(d){return d.x})
                .attr('cy', function(d){return d.y})
                .attr('r', function(d){return d.r})
                .attr('fill', function(d) {
                })
        }

        var draw = function() {     
 
            // Make a copy of your data, stored in an object {children:FILTERED-DATA}
            scope.filteredData = angular.copy(scope.root)//filtered)}
            var focus = scope.root,
                    nodes = pack.nodes(scope.filteredData),
                    view;

            var circle = svg.selectAll("circle")
                    .data(nodes)
                .enter().append("circle")
                    .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--scope.root"; })
                    .style("fill", function(d) { return d.children ? color(d.depth) : null; })
                    .call(circleFunc)
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
                d3.select(self.frameElement).style("height", diameter + "px");
            }
        }
    };
});