<template>
  <div>
    <v-alert :value="true" type="success" v-if="done" outline>
      Arquivo enviado e aguardando processamento
    </v-alert>
    <input
      type="file"
      accept="application/pdf"
      :multiple="false"
      ref="fileInput"
      @change="onFileChange"
    />
    <br />
    <br />
    <br />
    <br />
    <br />
    <v-btn @click="teste" color="info" dark>Enviar</v-btn>
    <br />
    <br />
    <v-progress-circular
      :rotate="-90"
      :size="100"
      :width="15"
      :value="progress"
      color="primary"
      v-if="done === false"
    >
      {{ progress }}%
    </v-progress-circular>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",

  data() {
    return {
      chunk_size: 64 * 1024,
      done: false,
      file: null,
      progress: 0
    };
  },
  mounted() {},
  methods: {
    teste() {
      this.done = false;
      this.progress = 0;
      this.$socket.emit(
        "start-transfer",
        this.file.name,
        this.file.size,
        filename => {
          console.log(filename);
          if (!filename) {
            // the server rejected the transfer
            this.onReadError(this.file, 0, 0, "Upload rejected by server");
          } else {
            // the server allowed the transfer with the given filename
            this.server_filename = filename;
            this.readFileChunk(
              this.file,
              0,
              this.chunk_size,
              this.onReadSuccess.bind(this),
              this.onReadError.bind(this)
            );
          }
        }
      );
    },
    onFileChange($event) {
      const files = $event.target.files || $event.dataTransfer.files;
      // this.form.binaryDo100cumento = files[0];
      this.done = false;
      this.file = files[0];
    },
    readFileChunk(file, offset, length, success, error) {
      var end_offset = offset + length;
      if (end_offset > file.size) end_offset = file.size;
      var r = new FileReader();
      r.onload = function(file, offset, length, e) {
        if (e.target.error != null) error(file, offset, length, e.target.error);
        else success(file, offset, length, e.target.result);
      }.bind(r, file, offset, length);
      r.readAsArrayBuffer(file.slice(offset, end_offset));
    },
    onReadSuccess(file, offset, length, data) {
      if (this.done) {
        return;
      }
      if (!this.$socket.connected) {
        // the WebSocket connection was lost, wait until it comes back
        setTimeout(
          this.onReadSuccess.bind(this, file, offset, length, data),
          5000
        );
        return;
      }
      this.$socket.emit(
        "write-chunk",
        this.server_filename,
        offset,
        data,
        function(offset, ack) {
          if (!ack)
            this.onReadError(
              this.file,
              offset,
              0,
              "Transfer aborted by server"
            );
        }.bind(this, offset)
      );
      var end_offset = offset + length;
      // this.progress = parseInt((300 * end_offset) / file.size);
      var proces = parseInt((100 * end_offset) / file.size);
      if (this.progress !== proces) {
        if (this.multiple(proces, 5)) {
          this.progress = proces;
        }
      }

      if (end_offset < file.size)
        this.readFileChunk(
          file,
          end_offset,
          this.chunk_size,
          this.onReadSuccess.bind(this),
          this.onReadError.bind(this)
        );
      else {
        // this.progress.classList.add('complete');
        // this.progress.classList.remove('in-progress');

        this.done = true;
        this.progress = 100;
        // alert("Transferência concluida");
      }
    },
    onReadError(file, offset, length, error) {
      console.log("Upload error for " + file.name + ": " + error);
      alert("Upload falhou.");
      // this.progress.classList.add('error');
      // this.progress.classList.remove('in-progress');
      this.done = true;
      this.progress = 0;
    },
    multiple(valor, multiple) {
      var resto = valor % multiple;
      if (resto === 0) return true;
      else return false;
    }
  }
};
</script>

<style scoped></style>
