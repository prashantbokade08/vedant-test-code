cd ~/vedant_todo/vedant-test-code

docker build -t vedant-todo-backend ./backend
docker build \
  --build-arg VITE_API_BASE=/api \
  -t vedant-todo-frontend ./frontend

docker images | grep vedant-todo

export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

export BACKEND_REPO=vedant-todo-backend
export FRONTEND_REPO=vedant-todo-frontend

aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 047646727557.dkr.ecr.ap-south-1.amazonaws.com

docker build -t vedant-todo-backend .

docker tag vedant-todo-backend:latest 047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-backend:latest

docker push 047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-backend:latest

aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 047646727557.dkr.ecr.ap-south-1.amazonaws.com

docker build -t vedant-todo-frontend .

docker tag vedant-todo-frontend:latest 047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-frontend:latest

docker push 047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-frontend:latest

aws ecr describe-images \
  --repository-name vedant-todo-backend \
  --region $AWS_REGION

aws ecr describe-images \
  --repository-name vedant-todo-frontend \
  --region $AWS_REGION

docker images | grep vedant-todo

kubernetes/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: vedant-todo-secret
  namespace: vedant-todo
type: Opaque
stringData:
  MONGO_URI: "your MongoDB Atlas connection string"


aws eks update-kubeconfig \
  --region ap-south-1 \
  --name vedant-test-eks

kubectl get nodes
kubectl get pods -A
kubectl get svc -A
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

kubectl rollout status deployment/metrics-server -n kube-system

kubectl get deployment metrics-server -n kube-system
kubectl top nodes


kubectl get nodes
kubectl get nodes -o wide
kubectl config current-context

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml


kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
kubectl apply -f kubernetes/backend-hpa.yaml
kubectl apply -f kubernetes/frontend-hpa.yaml
kubectl apply -f kubernetes/pdb.yaml
kubectl apply -f kubernetes/ingress.yaml

kubectl rollout status deployment/todo-backend -n vedant-todo
kubectl rollout status deployment/todo-frontend -n vedant-todo
kubectl get ingress -n vedant-todo -w

kubectl get namespace vedant-todo
kubectl get deployment \
  aws-load-balancer-controller \
  -n kube-system

eksctl utils associate-iam-oidc-provider \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER_NAME" \
  --approve

curl -o iam-policy.json \
https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json


Install Metrics Server

Apply Metrics Server:

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Check:

kubectl get deployment metrics-server -n kube-system

Wait for it:

kubectl rollout status deployment/metrics-server -n kube-system

Test:

kubectl top nodes

If node metrics are available, you should see CPU and memory usage.

Check pods:

kubectl get pods -n kube-system | grep metrics

Download the IAM policy:

curl -o iam-policy.json \
https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

Create the IAM policy:

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

If the policy already exists, do not create it again. Get its ARN:

export LBC_POLICY_ARN=$(aws iam get-policy \
  --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --query 'Policy.Arn' \
  --output text)


heck all pods:

kubectl get pods -n vedant-todo -o wide

Check failed pods:

kubectl get pods -n vedant-todo | grep -v Running

Describe deployment:

kubectl describe deployment \
  todo-backend \
  -n vedant-todo

kubectl describe deployment \
  todo-frontend \
  -n vedant-todo

Check events:

kubectl get events \
  -n vedant-todo \
  --sort-by=.lastTimestamp

Check backend ReplicaSets:

kubectl get rs -n vedant-todo

Check ingress events:

kubectl describe ingress \
  -n vedant-todo

Check AWS Load Balancer Controller logs:

kubectl logs \
  -n kube-system \
  deployment/aws-load-balancer-controller

deployment is stuck

Backend:

kubectl rollout restart \
  deployment/todo-backend \
  -n vedant-todo

Frontend:

kubectl rollout restart \
  deployment/todo-frontend \
  -n vedant-todo

Watch:

kubectl rollout status \
  deployment/todo-backend \
  -n vedant-todo

kubectl rollout status \
  deployment/todo-frontend \
  -n vedant-todo

Final verification

Run:

kubectl get nodes

kubectl get pods -n vedant-todo

kubectl get svc -n vedant-todo

kubectl get hpa -n vedant-todo

kubectl get pdb -n vedant-todo

kubectl get ingress -n vedant-todo

kubectl get all -n vedant-todo

kubectl get ingress -n vedant-todo
