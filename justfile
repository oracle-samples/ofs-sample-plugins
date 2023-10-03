upgrade-package package-name: 
    for sample in samples/*; do \
        if [ -d $sample ]; then (cd $sample; echo "Updating {{package-name}}" ; npm install {{package-name}}; cd .. ;) fi ; \
    done 

create-plugin plugin-name:
    cookiecutter https://github.com/oracle-samples/ofs-sample-plugins --directory="templates/basic"
