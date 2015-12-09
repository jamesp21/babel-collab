var root;
var jsonResult;
var baseUrl = 'http://babel-us-east-1.eigenfactor.org/search?q=';
var myApp = angular.module('myApp', []);

myApp.controller('myCtrl', function($scope, $http) {
    $scope.selected = ""

    //when search button is clicked
    $scope.getSearch = function() {

        //gets 10 search results from the babel back end and does it 3 more times for a total of 40 search items
        $http.get(baseUrl + $scope.usrSearch).success(function(response){
            $http.get(baseUrl + $scope.usrSearch + "&start=10").success(function(response2){
                $http.get(baseUrl + $scope.usrSearch + "&start=20").success(function(response3){ 
                    $http.get(baseUrl + $scope.usrSearch + "&start=30").success(function(response4){
                        var sum = response.results;
                        sum = sum.concat(response2.results);
                        sum = sum.concat(response3.results);
                        sum = sum.concat(response4.results);

                        //case where no results are found
                        if (sum == "") {
                            $scope.selected = "No results found"
                        } else {
                            $scope.selected = $scope.usrSearch
                            //sends search results to build heirarchy function
                            root = $scope.bubbles = buildHierarchy(sum) 
                            console.log(root)
                        }
                    })
                })
            })
        })
    };

    //function that gets search items and makes it into a nested hierarchy json structure creating children based
    //  on labels, publishers, and articel title
    var buildHierarchy = function(json) {
        var structuredObject = {
            "name" : "root",
            "children" : []
        }

        //looping through data and checking if book doesn't have label
        for (var i = 0; i < json.length; i++) {
            var book = json[i];
            //case where book doesn't have a label
            if (book.label == undefined) {
                book.label = "no label"
            }
            addLabel(book.label, book, structuredObject.children)
        }

        //looping through data to nest the labels
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

        //looping through data to nest the publishers
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

        //returns nested json structure
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

        scope.$watch('root', function(){
            if (scope.root == undefined) return
            draw()
        })

        //sets size of the biggest outer circle
        var margin = 20,
            diameter = 960;
        diameter.id = ("diameter");

        var color = d3.scale.linear()
            .domain([-1, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        var pack = d3.layout.pack()
            .padding(2)
            .size([diameter - margin, diameter - margin])
            .value(function(d) { return d.score })

        var svg = wrapper.append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        //Puts circles on the screen based off of information found in data
        var draw = function() {     
            // Make a copy of your data, stored in an object {children:FILTERED-DATA}
            scope.filteredData = angular.copy(scope.root)//filtered)}
            var focus = scope.root,
                nodes = pack.nodes(scope.filteredData),
                view;

            //solution to solve second search glitch
            svg.selectAll("circle").remove();

            // selects all circles in svg, binds data to them and assigns them properties
            var circle = svg.selectAll("circle")
                .data(nodes, function(d) {return d.title});
            circle.enter().append("circle")
                .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--scope.root"; })
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

            //solution to solve second search glitch
            svg.selectAll("text").remove();

            //Displays information about the results (labels of categories and titles of articles)
            var text = svg.selectAll("text")
                    .data(nodes);

                text.enter().append("text")
                    .attr("class", "label")
                    .attr("id", "textwrap")
                    //Sets labels to half opacity and titles to full opacity
                    .style("opacity", function(d) { return d.parent === scope.filteredData ? 0.5 : 1; })
                    .style("display", function(d) { return d.parent === scope.filteredData ? "block" : "none"; })
                    //Makes label and title size pretty big and keeps labels with one child relatively small
                    .style("font-size", function(d) { return (d.children !== undefined && d.children.length == 1) ? 10 : 30; })      
                    .text(function(d) { return d.title});
            

            var node = svg.selectAll("circle,text");

            wrapper
                .style("background", color(-10))
                .on("click", function(d) {  zoom(scope.filteredData); });

             zoomTo([scope.filteredData.x, scope.filteredData.y, scope.filteredData.r * 2 + margin]);

            //Sets all the properties for when the circle is zoomed
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


            //Zooms to the specified circle when clicked
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