import os
import sys
import json

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

# Set testing environment so we do not trigger real DB startup connections
os.environ["TESTING"] = "1"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), '../sentinel_test.db'))

try:
    from main import app
except Exception as e:
    print(f"Error importing FastAPI app: {e}", file=sys.stderr)
    sys.exit(1)

routes_list = []

for route in app.routes:
    if hasattr(route, "path") and route.path.startswith("/api"):
        methods = list(route.methods) if hasattr(route, "methods") else []
        endpoint = route.endpoint
        
        # Default security settings: all roles allowed, no features gated
        role_access = ["OWNER", "MANAGER", "STAFF"]
        gated_feature = None
        
        # Inspect route-level dependencies (registered via dependencies=[Depends(...)])
        route_deps = getattr(route, "dependencies", [])
        for dep in route_deps:
            dep_call = dep.dependency
            dep_name = getattr(dep_call, "__name__", "")
            
            # Introspect closures for role_checker and feature_checker
            if "role_checker" in dep_name:
                if hasattr(dep_call, "__closure__") and dep_call.__closure__:
                    for cell in dep_call.__closure__:
                        val = cell.cell_contents
                        if isinstance(val, list):
                            role_access = val
            elif "feature_checker" in dep_name:
                if hasattr(dep_call, "__closure__") and dep_call.__closure__:
                    for cell in dep_call.__closure__:
                        val = cell.cell_contents
                        if isinstance(val, str):
                            gated_feature = val
                            
        # Inspect endpoint-level dependencies (registered in endpoint signature def endpoint(user = Depends(...)))
        dependant = getattr(route, "dependant", None)
        if dependant:
            for d in dependant.dependencies:
                dep_call = d.call
                dep_name = getattr(dep_call, "__name__", "")
                
                if "role_checker" in dep_name:
                    if hasattr(dep_call, "__closure__") and dep_call.__closure__:
                        for cell in dep_call.__closure__:
                            val = cell.cell_contents
                            if isinstance(val, list):
                                role_access = val
                elif "feature_checker" in dep_name:
                    if hasattr(dep_call, "__closure__") and dep_call.__closure__:
                        for cell in dep_call.__closure__:
                            val = cell.cell_contents
                            if isinstance(val, str):
                                gated_feature = val

        routes_list.append({
            "path": route.path,
            "methods": sorted(methods),
            "endpoint": endpoint.__name__,
            "summary": route.summary or route.description or "",
            "role_access": sorted(role_access),
            "gated_feature": gated_feature
        })

# Output to JSON functionality map
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'functionality_map.json'))
with open(output_path, 'w') as f:
    json.dump(routes_list, f, indent=2)

print(f"Generated functionality map with {len(routes_list)} routes at {output_path}")
