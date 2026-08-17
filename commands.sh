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
  VAPID_PUBLIC: "your public VAPID key"
  VAPID_PRIVATE: "your private VAPID key"


sed -i "s#047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-backend:latest#$ECR_REGISTRY/vedant-todo-backend:$IMAGE_TAG#" kubernetes/backend-deployment.yaml
sed -i "s#047646727557.dkr.ecr.ap-south-1.amazonaws.com/vedant-todo-frontend:latest#$ECR_REGISTRY/vedant-todo-frontend:$IMAGE_TAG#" kubernetes/frontend-deployment.yaml


eksctl create cluster \
  --name vedant-test-eks \
  --region ap-south-1 \
  --version auto \
  --nodegroup-name vedant-test-ng \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed

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

eksctl utils associate-iam-oidc-provider \
  --region ap-south-1 \
  --cluster vedant-test-eks \
  --approve

aws eks describe-cluster \
  --name vedant-test-eks \
  --region ap-south-1 \
  --query "cluster.identity.oidc.issuer"





aws eks update-kubeconfig \
  --region ap-south-1 \
  --name vedant-test-eks



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




aws eks describe-cluster \
  --name vedant-test-eks \
  --region ap-south-1 \
  --query "cluster.resourcesVpcConfig.vpcId" \
  --output text


helm version



